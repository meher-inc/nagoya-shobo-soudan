export interface Env {
  DB: D1Database;
  AI: Ai;
  ASSETS: Fetcher;
  CHAT_LIMITER: RateLimit;
  AI_MODEL: string;
  /** "1" で設置義務・届出の要否をルールで判定し、結果を回答の前提として渡す（src/rules） */
  RULES_ENABLED?: string;
  /** e.g. https://example.todokede.jp. Pages use it for canonical URLs; workers.dev redirects to it. */
  CANONICAL_ORIGIN?: string;
  STRIPE_API_BASE: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  STRIPE_SECRET_KEY?: string;
  /** 省略可。なければ stripe-setup.ts が lookup_key で探し、なければ作る */
  STRIPE_PRICE_ID?: string;
  /** 省略可。なければ stripe-setup.ts が Webhook を作り、秘密値を D1 の settings に保存する */
  STRIPE_WEBHOOK_SECRET?: string;
  /** Local E2E and the staging environment only. Never set in production. */
  E2E_MODE?: string;
  /** "staging" on the staging Worker (wrangler.jsonc env.staging), where the test endpoints also work. */
  ENV_NAME?: string;
  AI_MOCK?: string;
  /** Comma-separated Google accounts that may open /admin. */
  ADMIN_EMAILS?: string;
  /** Cloudflare Turnstile (invisible). Anonymous use starts with a check only when both are set. */
  TURNSTILE_SITEKEY?: string;
  TURNSTILE_SECRET?: string;
  /** Comma-separated hostnames a token may come from (defaults to the request host). */
  TURNSTILE_HOSTNAMES?: string;
}

export interface User {
  id: string;
  google_sub: string;
  email: string;
  name: string | null;
  picture: string | null;
  trial_started_at: number | null;
  stripe_customer_id: string | null;
  subscription_status: string | null;
  current_period_end: number | null;
  is_anonymous: number;
  ip_hash: string | null;
  created_at: number;
  consent_version: string | null;
  consent_at: number | null;
  revisited_at: number | null;
}

export type AppEnv = { Bindings: Env; Variables: { user: User | null } };
