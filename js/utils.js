"use strict";
/* ==========================================================
   NAMUNA SHOP — ёрирасонҳои умумӣ
   ========================================================== */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ---------- localStorage (бехатар) ---------- */
const KEYS = {
  cart: "namuna_cart",
  favorites: "namuna_favorites",
  recent: "namuna_recent",
  prefs: "namuna_prefs"
};
const Store = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ҷой пур аст */ }
  }
};
const Prefs = {
  get(name, fallback) { const p = Store.get(KEYS.prefs, {}); return name in p ? p[name] : fallback; },
  set(name, value) { const p = Store.get(KEYS.prefs, {}); p[name] = value; Store.set(KEYS.prefs, p); }
};

/* ---------- матн ва нарх ---------- */
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function formatPrice(n) {
  const num = Math.round(Number(n) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0");
  return num + "\u00A0" + (STORE_CONFIG.currency || "с.");
}
/* Ҳарфҳои махсуси тоҷикиро барои ҷустуҷӯ содда мекунад (ӣ->и, ӯ->у ва ғайра) */
function normalizeText(s) {
  const map = { "ӣ": "и", "ӯ": "у", "қ": "к", "ғ": "г", "ҳ": "х", "ҷ": "ч", "ё": "е" };
  return String(s).toLowerCase().replace(/[ӣӯқғҳҷё]/g, c => map[c]).trim();
}
function debounce(fn, ms = 120) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}
function getParam(name) { return new URLSearchParams(location.search).get(name); }
function cleanHandle(s) { return String(s || "").trim().replace(/^@/, "").replace(/^https?:\/\/[^/]+\//, ""); }
function onlyDigits(s) { return String(s || "").replace(/\D/g, ""); }

/* ---------- нусха ба клипборд ---------- */
async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); return true; }
  } catch (e) { /* ба роҳи эҳтиётӣ мегузарем */ }
  try {
    const ta = document.createElement("textarea");
    ta.value = text; ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;top:0;left:0;opacity:0";
    document.body.appendChild(ta); ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch (e) { return false; }
}

/* ---------- SVG-нишонаҳо (услуби Lucide, 24x24) ---------- */
const ICONS = {
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  grid: '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
  heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  bag: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  menu: '<line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>',
  filter: '<line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/>',
  sort: '<path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  arrowLeft: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  arrowRight: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  chevLeft: '<path d="m15 18-6-6 6-6"/>',
  chevRight: '<path d="m9 18 6-6-6-6"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  minus: '<path d="M5 12h14"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>',
  eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  expand: '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>',
  zoom: '<circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="11" x2="11" y1="8" y2="14"/><line x1="8" x2="14" y1="11" y2="11"/>',
  copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  telegram: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  instagram: '<rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>',
  whatsapp: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
  tag: '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>',
  sparkle: '<path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4Z"/>'
};
function icon(name, size = 22, extra = "") {
  return `<svg class="icon ${extra}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[name] || ""}</svg>`;
}
/* Тугмаи нишонавӣ бо aria-label ва title */
function iconButton(name, label, attrs = "", cls = "icon-btn", size = 22) {
  return `<button type="button" class="${cls}" aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}" ${attrs}>${icon(name, size)}</button>`;
}

/* ---------- расм ва ҷойгузини расм ---------- */
const PLACEHOLDER_IMG = "data:image/svg+xml," + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800"><rect width="600" height="800" fill="#141414"/>' +
  '<rect x="14" y="14" width="572" height="772" rx="26" fill="none" stroke="#6b5820" stroke-width="2"/>' +
  '<text x="300" y="410" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="30" fill="#d4af37" letter-spacing="6">NAMUNA SHOP</text></svg>'
);
function imgFallback(img) {
  img.onerror = null;
  img.src = PLACEHOLDER_IMG;
  img.classList.add("is-placeholder");
}
function imgHTML(src, alt, cls = "", attrs = "") {
  return `<img class="${cls}" src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" width="600" height="800" loading="lazy" decoding="async" ${attrs} onerror="imgFallback(this)">`;
}

/* ---------- кӯмакиҳои маҳсулот ---------- */
function getProduct(id) { return PRODUCTS.find(p => p.id === Number(id)); }
function isOnSale(p) { return !!p.sale && p.oldPrice > p.price; }
function discountPercent(p) { return isOnSale(p) ? Math.round((1 - p.price / p.oldPrice) * 100) : 0; }
function productUrl(p, colorIdx = 0) { return `product.html?id=${p.id}${colorIdx ? "&c=" + colorIdx : ""}`; }
function colorHex(c) { return c.hex || COLOR_HEX[c.name] || "#777777"; }
function isLightColor(hex) {
  const h = hex.replace("#", "");
  const r = parseInt(h.substr(0, 2), 16), g = parseInt(h.substr(2, 2), 16), b = parseInt(h.substr(4, 2), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150;
}
function colorImages(p, colorIdx = 0) {
  const c = p.colors[colorIdx] || p.colors[0];
  return c && c.images && c.images.length ? c.images : [PLACEHOLDER_IMG];
}
function productBadges(p) {
  const list = [];
  if (isOnSale(p)) list.push({ cls: "badge--sale", text: "−" + discountPercent(p) + "%" });
  if (p.newArrival) list.push({ cls: "badge--new", text: "Нав" });
  if (p.hot) list.push({ cls: "badge--hot", text: "Машҳур" });
  if (p.limited) list.push({ cls: "badge--limited", text: "Limited" });
  return list;
}
function badgesHTML(p, max = 2) {
  return productBadges(p).slice(0, max).map(b => `<span class="badge ${b.cls}">${b.text}</span>`).join("");
}
function starsHTML(rating) {
  const full = Math.round(rating);
  let s = "";
  for (let i = 1; i <= 5; i++) s += icon("star", 15, i <= full ? "star is-full" : "star");
  return `<span class="stars" role="img" aria-label="${rating} аз 5">${s}</span>`;
}
function getReviews(p, n = 3) {
  const out = [];
  for (let i = 0; i < n; i++) out.push(DEMO_REVIEWS[(p.id + i) % DEMO_REVIEWS.length]);
  return out;
}
function priceHTML(p, cls = "") {
  return `<div class="price ${cls}"><strong>${formatPrice(p.price)}</strong>${isOnSale(p) ? `<s>${formatPrice(p.oldPrice)}</s>` : ""}</div>`;
}

/* ---------- ишораи ҷои фармоишӣ (swipe) ---------- */
function onSwipe(el, callback, threshold = 40) {
  let sx = 0, sy = 0, active = false;
  el.addEventListener("touchstart", e => {
    if (e.touches.length !== 1) { active = false; return; }
    sx = e.touches[0].clientX; sy = e.touches[0].clientY; active = true;
  }, { passive: true });
  el.addEventListener("touchend", e => {
    if (!active) return;
    active = false;
    const t = e.changedTouches[0];
    const dx = t.clientX - sx, dy = t.clientY - sy;
    if (Math.abs(dx) > threshold && Math.abs(dx) > Math.abs(dy) * 1.4) {
      el.dataset.swiped = "1";
      setTimeout(() => { delete el.dataset.swiped; }, 350);
      callback(dx < 0 ? "left" : "right");
    }
  }, { passive: true });
}

/* ---------- Қабатҳо: drawer, sheet, modal ---------- */
const Layers = {
  stack: [],
  backdrop: null,
  init() {
    if (this.backdrop) return;
    this.backdrop = document.createElement("div");
    this.backdrop.className = "backdrop";
    this.backdrop.addEventListener("click", () => this.closeTop());
    document.body.appendChild(this.backdrop);
    document.addEventListener("keydown", e => { if (e.key === "Escape") this.closeTop(); });
    document.addEventListener("click", e => {
      const closer = e.target.closest("[data-close]");
      if (closer) { const layer = closer.closest(".layer"); if (layer) this.close(layer); }
    });
  },
  open(el) {
    if (!el || this.stack.includes(el)) return;
    el._returnFocus = document.activeElement;
    this.stack.push(el);
    el.setAttribute("aria-hidden", "false");
    requestAnimationFrame(() => el.classList.add("is-open"));
    this.sync();
    const target = el.querySelector("[data-autofocus]") || el.querySelector("button, a[href], input");
    setTimeout(() => target && target.focus({ preventScroll: true }), 80);
  },
  close(el) {
    const i = this.stack.indexOf(el);
    if (i < 0) return;
    this.stack.splice(i, 1);
    el.classList.remove("is-open");
    el.setAttribute("aria-hidden", "true");
    this.sync();
    const back = el._returnFocus;
    if (back && back.focus && document.contains(back)) back.focus({ preventScroll: true });
  },
  closeTop() { if (this.stack.length) this.close(this.stack[this.stack.length - 1]); },
  closeAll() { [...this.stack].forEach(el => this.close(el)); },
  sync() {
    const any = this.stack.length > 0;
    this.backdrop.classList.toggle("is-open", any);
    document.documentElement.classList.toggle("no-scroll", any);
  }
};

/* ---------- Огоҳиҳо (toast) ---------- */
function toast(message, iconName = "check") {
  let box = $("#toasts");
  if (!box) {
    box = document.createElement("div");
    box.id = "toasts";
    box.className = "toasts";
    box.setAttribute("role", "status");
    box.setAttribute("aria-live", "polite");
    document.body.appendChild(box);
  }
  const el = document.createElement("div");
  el.className = "toast";
  el.innerHTML = icon(iconName, 18) + `<span>${escapeHtml(message)}</span>`;
  box.appendChild(el);
  while (box.children.length > 3) box.firstChild.remove();
  setTimeout(() => { el.classList.add("is-out"); setTimeout(() => el.remove(), 320); }, 2300);
}

/* ---------- Скелетон ва пайдошавии оҳиста ---------- */
function skeletonCards(n = 4) {
  return Array.from({ length: n }, () =>
    `<div class="card card--skeleton" aria-hidden="true"><div class="card__media skeleton"></div><div class="skeleton skeleton--line"></div><div class="skeleton skeleton--line short"></div></div>`
  ).join("");
}
let revealObserver = null;
function observeReveals(root = document) {
  const items = $$(".reveal:not(.in)", root);
  if (!("IntersectionObserver" in window)) { items.forEach(i => i.classList.add("in")); return; }
  if (!revealObserver) {
    revealObserver = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add("in"); revealObserver.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.05 });
  }
  items.forEach(i => revealObserver.observe(i));
}
