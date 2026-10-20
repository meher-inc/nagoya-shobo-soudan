import type { Context } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import type { AppEnv, Env, User } from "./env";
import { SERVICE } from "../config/service";

const SESSION_COOKIE = "sid";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const TRIAL_MS = SERVICE.trialHours * 60 * 60 * 1000;
const IP_WINDOW_MS = 24 * 60 * 60 * 1000;

export function isHttps(c: Context<AppEnv>): boolean {
  return new URL(c.req.url).protocol === "https:";
}

export function randomToken(bytes = 32): string {
  const buf = crypto.getRandomValues(new Uint8Array(bytes));
  return base64url(buf);
}

export function base64url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function sha256(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return base64url(digest);
}

export async function createSession(c: Context<AppEnv>, userId: string): Promise<void> {
  const token = randomToken();
  const expiresAt = Date.now() + SESSION_TTL_MS;
  await c.env.DB.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)")
    .bind(await sha256(token), userId, expiresAt)
    .run();
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isHttps(c),
    sameSite: "Lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function loadUser(c: Context<AppEnv>): Promise<User | null> {
  const token = getCookie(c, SESSION_COOKIE);
  if (!token) return null;
  const row = await c.env.DB.prepare(
    "SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?",
  )
    .bind(await sha256(token), Date.now())
    .first<User>();
  return row ?? null;
}

function clientIp(c: Context<AppEnv>): string {
  // Local E2E only: lets each test act as a distinct client.
  if (c.env.E2E_MODE === "1" && c.req.header("x-test-ip")) return c.req.header("x-test-ip")!;
  return c.req.header("cf-connecting-ip") ?? "unknown";
}

/** Creates an anonymous trial user with a session, or returns null when this IP has used up its trials. */
export async function createAnonymousUser(c: Context<AppEnv>): Promise<User | null> {
  const ipHash = await sha256(`${SERVICE.id}:${clientIp(c)}`);
  const since = Date.now() - IP_WINDOW_MS;
  const used = await c.env.DB.prepare("SELECT COUNT(*) AS n FROM users WHERE is_anonymous = 1 AND ip_hash = ? AND created_at > ?")
    .bind(ipHash, since)
    .first<{ n: number }>();
  if ((used?.n ?? 0) >= SERVICE.anonTrialsPerIp) return null;
  const id = crypto.randomUUID();
  const now = Date.now();
  await c.env.DB.prepare(
    "INSERT INTO users (id, google_sub, email, is_anonymous, ip_hash, created_at) VALUES (?, ?, '', 1, ?, ?)",
  )
    .bind(id, `anon:${id}`, ipHash, now)
    .run();
  await createSession(c, id);
  return (await c.env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(id).first<User>())!;
}

export async function destroySession(c: Context<AppEnv>): Promise<void> {
  const token = getCookie(c, SESSION_COOKIE);
  if (token) {
    await c.env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(await sha256(token)).run();
  }
  deleteCookie(c, SESSION_COOKIE, { path: "/", secure: isHttps(c) });
}

export type AccessState = "trial" | "paid" | "expired";

/** No user yet means the trial has not started: anyone can send the first message. */
export function accessOf(user: User | null, now = Date.now()) {
  if (!user) return { state: "trial" as AccessState, trialEndsAt: null };
  const paid = user.subscription_status === "active" || user.subscription_status === "trialing";
  const trialEndsAt = user.trial_started_at ? user.trial_started_at + TRIAL_MS : null;
  if (paid) return { state: "paid" as AccessState, trialEndsAt };
  if (trialEndsAt === null || now < trialEndsAt) return { state: "trial" as AccessState, trialEndsAt };
  return { state: "expired" as AccessState, trialEndsAt };
}

export function publicMe(user: User | null, env: Env) {
  const access = accessOf(user);
  return {
    user: user && !user.is_anonymous ? { email: user.email, name: user.name, picture: user.picture } : null,
    hasSession: Boolean(user),
    access: access.state,
    trialEndsAt: access.trialEndsAt,
    loginAvailable: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) || env.E2E_MODE === "1",
    billingAvailable: Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_PRICE_ID),
  };
}
