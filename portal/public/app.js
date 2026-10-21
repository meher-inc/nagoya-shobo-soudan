// トドケデ AI 入口: 前回選んだ地域（端末に保存）を一覧の上に出す。選んだ地域は端末に保存する。
(() => {
  const KEY = "todokede-ai:city";
  const store = {
    get() { try { return localStorage.getItem(KEY) || ""; } catch { return ""; } },
    set(v) { try { localStorage.setItem(KEY, v); } catch { /* 保存できなくても動く */ } },
  };
  const cards = Array.from(document.querySelectorAll("#cities [data-city]"));
  const find = (slug) => cards.find((c) => c.dataset.city === slug);

  const saved = store.get();
  const slug = find(saved) ? saved : "";
  if (slug) {
    const src = find(slug);
    const box = document.getElementById("suggest");
    const link = document.getElementById("suggest-link");
    link.href = src.href;
    link.dataset.city = slug;
    link.querySelector(".city-name").textContent = src.querySelector(".city-name").textContent;
    link.querySelector(".city-pref").textContent = src.querySelector(".city-pref").textContent;
    box.hidden = false;
  }

  document.addEventListener("click", (e) => {
    const a = e.target.closest && e.target.closest("a[data-city]");
    if (a) store.set(a.dataset.city);
  });
})();
