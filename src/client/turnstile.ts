// Cloudflare Turnstile（見えないモード）。匿名利用を始める最初の送信のときだけ読み込み、利用者には何も表示しない
type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  execute: (id: string) => void;
  reset: (id: string) => void;
  remove: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let loading: Promise<TurnstileApi> | null = null;

function load(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  loading ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPT;
    s.async = true;
    s.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error("turnstile")));
    s.onerror = () => {
      loading = null;
      reject(new Error("turnstile"));
    };
    document.head.appendChild(s);
  });
  return loading;
}

// トークンは 1 回きり。取れなかった場合は null（サーバーがログインを案内する）
export async function turnstileToken(sitekey: string, timeoutMs = 15_000): Promise<string | null> {
  try {
    const api = await load();
    const holder = document.createElement("div");
    holder.hidden = true;
    document.body.appendChild(holder);
    return await new Promise<string | null>((resolve) => {
      let id = "";
      const done = (token: string | null) => {
        clearTimeout(timer);
        if (id) api.remove(id);
        holder.remove();
        resolve(token);
      };
      const timer = setTimeout(() => done(null), timeoutMs);
      id = api.render(holder, {
        sitekey,
        action: "anon_start",
        execution: "execute",
        appearance: "interaction-only",
        callback: (token: string) => done(token),
        "error-callback": () => done(null),
        "timeout-callback": () => done(null),
      });
      api.execute(id);
    });
  } catch {
    return null;
  }
}
