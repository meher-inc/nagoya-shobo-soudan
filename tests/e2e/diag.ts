// 一時的な計測（plan 20261112-webkit-e2e-stability）。原因の特定に使い、マージ前に消す
import type { Page, TestInfo } from "@playwright/test";

export async function installDiag(page: Page, info: TestInfo) {
  if (info.project.name !== "mobile-safari") return;
  const t0 = Date.now();
  const tag = `${info.title.slice(0, 40)}`;
  page.on("console", (m) => {
    const t = m.text();
    if (t.startsWith("[diag]")) console.log(`${((Date.now() - t0) / 1000).toFixed(1)}s ${tag} ${t}`);
  });
  page.on("requestfailed", (r) => console.log(`${((Date.now() - t0) / 1000).toFixed(1)}s ${tag} [diag] requestfailed ${r.method()} ${r.url()} ${r.failure()?.errorText}`));
  page.on("framenavigated", (f) => f === page.mainFrame() && console.log(`${((Date.now() - t0) / 1000).toFixed(1)}s ${tag} [diag] navigated ${f.url()}`));
  await page.addInitScript(() => {
    const log = (...a: unknown[]) => console.log("[diag]", ...a);
    let last = performance.now();
    const raf = () => {
      const now = performance.now();
      if (now - last > 1000) log(`raf-gap ${Math.round(now - last)}ms`);
      last = now;
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
    let lastTick = performance.now();
    setInterval(() => {
      const now = performance.now();
      const timerGap = now - lastTick;
      lastTick = now;
      const stall = now - last;
      if (stall > 2000 || timerGap > 2000) {
        const anims = document.getAnimations().map((a) => {
          const n = (a as CSSAnimation).animationName ?? (a as CSSTransition).transitionProperty ?? "?";
          const el = (a.effect as KeyframeEffect | null)?.target as Element | null;
          return `${n}:${a.playState}@${el?.className?.toString().slice(0, 20) ?? "-"}`;
        });
        log(
          `stalled raf=${Math.round(stall)}ms timer=${Math.round(timerGap)}ms vis=${document.visibilityState} focus=${document.hasFocus()} vt=${(window as unknown as { __vt?: string }).__vt ?? "-"} glass=${document.querySelectorAll(".glass").length} sheet=${document.querySelectorAll(".sheet").length} anims=${anims.length} ${anims.slice(0, 12).join(",")}`,
        );
      }
    }, 1000);
    const doc = document as Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void>; updateCallbackDone: Promise<void>; ready: Promise<void> } };
    const svt = doc.startViewTransition?.bind(doc);
    if (svt) {
      doc.startViewTransition = (cb: () => void) => {
        const s = performance.now();
        const w = window as unknown as { __vt?: string };
        w.__vt = "started";
        log("vt start");
        const vt = svt(cb);
        vt.updateCallbackDone.then(() => log(`vt updated ${Math.round(performance.now() - s)}ms`), (e) => log(`vt update err ${e}`));
        vt.ready.then(() => log(`vt ready ${Math.round(performance.now() - s)}ms`), (e) => log(`vt ready err ${e}`));
        vt.finished.then(() => {
          w.__vt = "-";
          log(`vt finished ${Math.round(performance.now() - s)}ms`);
        });
        return vt;
      };
    }
    addEventListener("unhandledrejection", (e: Event) => log(`unhandledrejection ${String((e as PromiseRejectionEvent).reason)} ${(e as PromiseRejectionEvent).reason?.stack ?? ""}`));
    const of = window.fetch.bind(window);
    window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input instanceof Request ? input.url : input);
      const s = performance.now();
      return of(input, init).then(
        (r) => {
          if (performance.now() - s > 2000) log(`slow fetch ${url} ${Math.round(performance.now() - s)}ms`);
          return r;
        },
        (e: unknown) => {
          log(`fetch failed ${url} ${e}`);
          throw e;
        },
      );
    };
  });
}
