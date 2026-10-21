// トドケデ AI 入口: 地域を選び、質問を各都市のサイトへ ?q= で渡す（各都市のサイトが受け取ってすぐ送信する）。
(() => {
  const $ = (id) => document.getElementById(id);
  const app = document.querySelector(".app");
  const input = $("input");
  const send = $("send");
  const composer = $("composer");
  const pill = $("city-pill");
  const label = $("city-label");
  const sheet = $("sheet");
  const scrim = $("scrim");
  const toast = $("toast");
  const rows = Array.from(document.querySelectorAll("#city-list [data-city]"));
  const KEY = "todokede-ai:city";

  const store = {
    get() { try { return localStorage.getItem(KEY) || ""; } catch { return ""; } },
    set(v) { try { localStorage.setItem(KEY, v); } catch { /* 保存できなくても動く */ } },
  };
  const known = (slug) => rows.some((r) => r.dataset.city === slug);

  let city = "";
  let pending = ""; // 地域を選ぶ前に送られた質問

  function setCity(slug) {
    city = known(slug) ? slug : "";
    const row = rows.find((r) => r.dataset.city === city);
    label.textContent = row ? row.querySelector(".t").textContent : "地域を選択";
    pill.dataset.city = city;
    rows.forEach((r) => {
      r.classList.toggle("active", r === row);
      if (r === row) r.setAttribute("aria-current", "true");
      else r.removeAttribute("aria-current");
    });
  }

  function go(q) {
    const base = `https://${city}.todokede.jp/`;
    const url = q ? `${base}?q=${encodeURIComponent(q.slice(0, 2000))}` : base;
    app.classList.add("leaving");
    setTimeout(() => location.assign(url), 220);
  }

  function submit(q) {
    q = q.trim();
    if (!q) return;
    composer.classList.remove("shine");
    void composer.offsetWidth;
    composer.classList.add("shine");
    if (!city) {
      pending = q;
      openSheet();
      return;
    }
    go(q);
  }

  // Sheet
  let lastFocus = null;
  function openSheet() {
    lastFocus = document.activeElement;
    scrim.hidden = false;
    sheet.hidden = false;
    scrim.classList.remove("out");
    sheet.classList.remove("out");
    sheet.style.transform = "";
    pill.setAttribute("aria-expanded", "true");
    (rows.find((r) => r.dataset.city === city) || sheet).focus({ preventScroll: true });
  }
  function closeSheet() {
    if (sheet.hidden) return;
    pill.setAttribute("aria-expanded", "false");
    scrim.classList.add("out");
    sheet.classList.add("out");
    setTimeout(() => { scrim.hidden = true; sheet.hidden = true; sheet.style.transform = ""; }, 280);
    if (pending) { flash("地域を選ぶと相談を始めます。"); pending = ""; }
    (lastFocus && lastFocus.focus ? lastFocus : input).focus({ preventScroll: true });
  }
  pill.addEventListener("click", () => (sheet.hidden ? openSheet() : closeSheet()));
  scrim.addEventListener("click", closeSheet);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeSheet(); });
  rows.forEach((r) =>
    r.addEventListener("click", (e) => {
      e.preventDefault();
      setCity(r.dataset.city);
      store.set(city);
      const q = pending || input.value.trim();
      if (q) { pending = ""; go(q); return; }
      closeSheet();
      flash(`${r.querySelector(".t").textContent}を選びました。`);
    }),
  );
  // 下にスワイプで閉じる
  let startY = null;
  sheet.addEventListener("touchstart", (e) => { if (sheet.scrollTop <= 0) startY = e.touches[0].clientY; }, { passive: true });
  sheet.addEventListener("touchmove", (e) => {
    if (startY === null) return;
    const dy = Math.max(0, e.touches[0].clientY - startY);
    sheet.style.transform = `translateY(${dy}px)`;
  }, { passive: true });
  sheet.addEventListener("touchend", (e) => {
    if (startY === null) return;
    const dy = e.changedTouches[0].clientY - startY;
    startY = null;
    if (dy > 80) closeSheet();
    else sheet.style.transform = "";
  });

  // Composer
  function resize() {
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 168)}px`;
    send.disabled = !input.value.trim();
  }
  input.addEventListener("input", resize);
  input.addEventListener("focus", () => composer.classList.add("focus"));
  input.addEventListener("blur", () => composer.classList.remove("focus"));
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); submit(input.value); }
  });
  composer.addEventListener("submit", (e) => { e.preventDefault(); submit(input.value); });
  document.querySelectorAll("#chips .chip").forEach((c) => c.addEventListener("click", () => submit(c.textContent)));

  // Toast
  let toastTimer = 0;
  function flash(msg) {
    toast.textContent = msg;
    toast.hidden = false;
    toast.style.animation = "none";
    void toast.offsetWidth;
    toast.style.animation = "";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.hidden = true; }, 2600);
  }

  // Ripple と、ガラスの光をポインタに追従させる
  document.addEventListener("pointerdown", (e) => {
    const el = e.target.closest(".rp");
    if (!el) return;
    const r = el.getBoundingClientRect();
    const s = Math.max(r.width, r.height);
    const span = document.createElement("span");
    span.className = "ripple";
    span.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`;
    el.appendChild(span);
    setTimeout(() => span.remove(), 600);
  });
  document.addEventListener("pointermove", (e) => {
    const el = e.target.closest && e.target.closest(".glass");
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  });

  // 戻るボタンで戻ってきたとき（bfcache）に画面を戻す
  window.addEventListener("pageshow", () => app.classList.remove("leaving"));

  setCity(store.get() || document.body.dataset.guess || "");
  pill.setAttribute("aria-expanded", "false");
  resize();
  input.focus({ preventScroll: true });
  app.classList.add("ready");
  requestAnimationFrame(() => $("boot").classList.add("done"));
  setTimeout(() => $("boot").remove(), 600);
})();
