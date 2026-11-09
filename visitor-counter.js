/* حجابك — عدّاد زوار موحّد للصفحة الرئيسية وجميع الأقسام والنوافذ. */
(() => {
  "use strict";
  const API = "https://7jabek-visitor-counter.fazawjuh-jordan.workers.dev/api/visitors";
  const STORAGE_KEY = "7jabek-site-visitor-id-v1";
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  const css = document.createElement("style");
  css.textContent =
    ".hijabek-visitor-pill{display:inline-flex;align-items:center;justify-content:center;gap:7px;" +
    "direction:rtl;white-space:nowrap;background:rgba(255,253,248,.98);border:1px solid #d9ca9e;" +
    "border-radius:999px;padding:9px 12px;color:#285b3b;font:700 12px Tahoma,Arial,sans-serif;" +
    "box-shadow:0 7px 19px rgba(42,73,49,.13)}" +
    ".hijabek-visitor-pill strong{color:#956f23;font-weight:900;font-variant-numeric:tabular-nums}" +
    ".hijabek-visitor-icon{font-size:15px;line-height:1}" +
    ".hijabek-visitor-floating{position:fixed;right:13px;bottom:17px;z-index:12;pointer-events:none}" +
    ".hijabek-visitor-sheet{display:flex;justify-content:flex-start;margin:0 0 9px}" +
    "@media(max-width:370px){.hijabek-visitor-pill{font-size:11px;padding:8px 9px;gap:5px}" +
    ".hijabek-visitor-floating{right:9px;bottom:18px}}";
  document.head.appendChild(css);

  function pill() {
    const el = document.createElement("div");
    el.className = "hijabek-visitor-pill";
    el.title = "عدد المتصفحات التي زارت موقع حجابك منذ تشغيل العداد، وليس عدد النقرات";
    const icon = document.createElement("span");
    icon.className = "hijabek-visitor-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "👥";
    const label = document.createElement("span");
    label.textContent = "زوّار الموقع:";
    const number = document.createElement("strong");
    number.className = "hijabek-visitor-number";
    number.textContent = "—";
    el.append(icon, label, number);
    return el;
  }
  const floating = document.createElement("div");
  floating.className = "hijabek-visitor-floating";
  floating.appendChild(pill());
  document.body.appendChild(floating);

  // The site is a single-page app; the same number also appears in opened detail sheets.
  const sheet = document.querySelector(".sheet");
  if (sheet) {
    const wrapper = document.createElement("div");
    wrapper.className = "hijabek-visitor-sheet";
    wrapper.appendChild(pill());
    const details = sheet.querySelector(".detail");
    if (details) sheet.insertBefore(wrapper, details);
    else sheet.appendChild(wrapper);
  }

  function getVisitorId() {
    try {
      let id = localStorage.getItem(STORAGE_KEY);
      if (id && UUID.test(id)) return id;
      if (!globalThis.crypto || typeof crypto.randomUUID !== "function") return null;
      id = crypto.randomUUID();
      localStorage.setItem(STORAGE_KEY, id);
      return id;
    } catch (_) {
      return null; // Never pretend a new visit is unique when storage is unavailable.
    }
  }

  async function loadCount(id) {
    const options = id
      ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ visitorId: id }), cache: "no-store" }
      : { method: "GET", cache: "no-store" };
    const response = await fetch(API, options);
    if (!response.ok) throw new Error("visitor counter unavailable");
    const payload = await response.json();
    if (!Number.isSafeInteger(payload.count) || payload.count < 0) throw new Error("invalid count");
    return payload.count;
  }

  async function start() {
    const id = getVisitorId();
    try {
      let total;
      try { total = await loadCount(id); }
      catch (e) { if (!id) throw e; total = await loadCount(null); }
      const displayed = new Intl.NumberFormat("ar-JO").format(total);
      document.querySelectorAll(".hijabek-visitor-number").forEach(el => { el.textContent = displayed; });
    } catch (_) {
      document.querySelectorAll(".hijabek-visitor-pill").forEach(el => {
        el.title = "تعذّر تحميل عدد الزوار مؤقتًا";
      });
    }
  }
  start();
})();