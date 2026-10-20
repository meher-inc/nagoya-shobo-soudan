import { CONSENT_VERSION } from "../shared/consent";

export type Access = "trial" | "paid" | "expired";

export interface Me {
  user: { email: string; name: string | null; picture: string | null } | null;
  hasSession: boolean;
  access: Access;
  trialEndsAt: number | null;
  loginAvailable: boolean;
  billingAvailable: boolean;
  /** Invisible Turnstile site key, sent only before anonymous use starts. */
  turnstileSiteKey: string | null;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export interface ConversationSummary {
  id: string;
  title: string;
  updatedAt: number;
}

declare global {
  interface Window {
    __ME__?: Me;
  }
}

export async function fetchMe(): Promise<Me> {
  if (window.__ME__) {
    const me = window.__ME__;
    delete window.__ME__;
    return me;
  }
  return (await fetch("/api/me")).json();
}

export class ApiError extends Error {
  constructor(public status: number, public code: string) {
    super(code);
  }
}

export async function streamChat(
  message: string,
  conversationId: string | null,
  onChunk: (text: string) => void,
  signal: AbortSignal,
  turnstile?: string | null,
): Promise<string> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    // terms: the version of the notice under the composer this screen showed (sending counts as agreeing to it)
    body: JSON.stringify({ message, conversationId, terms: CONSENT_VERSION, turnstile: turnstile ?? undefined }),
    signal,
  });
  if (!res.ok || !res.body) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new ApiError(res.status, body.error ?? "error");
  }
  const id = res.headers.get("x-conversation-id") ?? "";
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    onChunk(decoder.decode(value, { stream: true }));
  }
  return id;
}

export async function listConversations(): Promise<ConversationSummary[]> {
  const res = await fetch("/api/conversations");
  if (!res.ok) return [];
  return ((await res.json()) as { conversations: ConversationSummary[] }).conversations;
}

export async function loadConversation(id: string): Promise<ChatMessage[]> {
  const res = await fetch(`/api/conversations/${id}`);
  if (!res.ok) throw new ApiError(res.status, "load_failed");
  const { messages } = (await res.json()) as { messages: ChatMessage[] };
  return messages;
}

export async function deleteConversation(id: string): Promise<void> {
  await fetch(`/api/conversations/${id}`, { method: "DELETE" });
}

export async function startCheckout(): Promise<string> {
  const res = await fetch("/api/billing/checkout", { method: "POST" });
  const body = (await res.json()) as { url?: string; error?: string };
  if (!res.ok || !body.url) throw new ApiError(res.status, body.error ?? "checkout_failed");
  return body.url;
}

export async function openPortal(): Promise<string> {
  const res = await fetch("/api/billing/portal", { method: "POST" });
  const body = (await res.json()) as { url?: string; error?: string };
  if (!res.ok || !body.url) throw new ApiError(res.status, body.error ?? "portal_failed");
  return body.url;
}

export async function logout(): Promise<void> {
  await fetch("/auth/logout", { method: "POST" });
}

/** Deletes the account and its history; an active plan is cancelled immediately. */
export async function deleteAccount(): Promise<void> {
  const res = await fetch("/api/account", { method: "DELETE" });
  if (!res.ok) {
    const b = (await res.json().catch(() => ({}))) as { error?: string };
    throw new ApiError(res.status, b.error ?? "delete_failed");
  }
}
