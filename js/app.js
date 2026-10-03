"use strict";
/* ==========================================================
   NAMUNA SHOP — ядро: сохтори умумӣ (header, nav, footer),
   корти маҳсулот, намоиши зуд, саҳифаи асосӣ, PWA
   ========================================================== */

const NAV = [
  { href: "index.html", label: "Саҳифаи асосӣ", page: "home" },
  { href: "catalog.html", label: "Каталог", page: "catalog" },
  { href: "catalog.html?filter=new", label: "Навгониҳо", page: "new" },
  { href: "catalog.html?filter=sale", label: "Тахфифҳо", page: "sale" }
];

function currentSection() {
  const page = document.body.dataset.page;
  if (page === "catalog") { const f = getParam("filter"); if (f === "new" || f === "sale") return f; }
  return page;
}

/* ---------- Пайвандҳои иҷтимоӣ (аз config.js) ---------- */
function socialLinksHTML() {
  const c = STORE_CONFIG;
  const tg = cleanHandle(c.telegramUsername), ig = cleanHandle(c.instagramUsername), wa = onlyDigits(c.whatsappNumber);
  const items = [
    ["telegram", "Telegram", tg ? `https://t.me/${tg}` : ""],
    ["instagram", "Instagram", ig ? `https://instagram.com/${ig}` : ""],
    ["whatsapp", "WhatsApp", wa ? `https://wa.me/${wa}` : ""]
  ];
  return items.map(([ic, label, href]) => href
    ? `<a class="icon-btn social" href="${href}" target="_blank" rel="noopener noreferrer" aria-label="${label}" title="${label}">${icon(ic, 20)}</a>`
    : `<button type="button" class="icon-btn social is-off" data-social-off="${label}" aria-label="${label}" title="${label}">${icon(ic, 20)}</button>`
  ).join("");
}

/* ---------- Сохтори умумӣ ---------- */
function buildLayout() {
  const cur = currentSection();
  const page = document.body.dataset.page;

  $("#siteHeader").innerHTML = `<div class="header__inner">
    <a class="logo" href="index.html" aria-label="NAMUNA SHOP — Саҳифаи асосӣ">NAMUNA <span>SHOP</span></a>
    <nav class="header__nav" aria-label="Асосӣ">${NAV.map(n => `<a href="${n.href}" ${n.page === cur ? 'aria-current="page"' : ""}>${n.label}</a>`).join("")}</nav>
    <div class="header__actions">
      ${iconButton("search", "Ҷустуҷӯ", "data-open-search")}
      <a class="icon-btn" href="favorites.html" aria-label="Дӯстдоштаҳо" title="Дӯстдоштаҳо">${icon("heart", 22)}<span class="count" data-fav-count hidden>0</span></a>
      <a class="icon-btn" href="cart.html" aria-label="Сабад" title="Сабад" data-open-cart>${icon("bag", 22)}<span class="count" data-cart-count hidden>0</span></a>
      ${iconButton("menu", "Феҳрист", "data-open-menu")}
    </div>
  </div>`;

  const bn = [
    ["home", "index.html", "home", "Саҳифаи асосӣ", "Асосӣ", ""],
    ["catalog", "catalog.html", "grid", "Каталог", "Каталог", ""],
    ["favorites", "favorites.html", "heart", "Дӯстдоштаҳо", "Дӯстдошта", '<span class="count" data-fav-count hidden>0</span>'],
    ["cart", "cart.html", "bag", "Сабад", "Сабад", '<span class="count" data-cart-count hidden>0</span>']
  ];
  $("#bottomNav").innerHTML = bn.map(([id, href, ic, label, short, extra]) =>
    `<a href="${href}" aria-label="${label}" title="${label}" ${id === page ? 'aria-current="page"' : ""} ${id === "cart" ? "data-open-cart" : ""}>${icon(ic, 22)}${extra}<span>${short}</span></a>`
  ).join("") +
    `<button type="button" aria-label="Феҳрист" title="Феҳрист" data-open-menu>${icon("menu", 22)}<span>Бештар</span></button>`;

  $("#siteFooter").innerHTML = `<div class="footer__inner">
    <div class="footer__brand">
      <a class="logo" href="index.html" aria-label="NAMUNA SHOP">NAMUNA <span>SHOP</span></a>
      <p>Услуби шумо. Интихоби шумо.</p>
      <div class="socials">${socialLinksHTML()}</div>
    </div>
    <nav class="footer__links" aria-label="Пайвандҳо">
      <a href="catalog.html">Каталог</a><a href="catalog.html?filter=new">Навгониҳо</a><a href="catalog.html?filter=sale">Тахфифҳо</a>
      <a href="favorites.html">Дӯстдоштаҳо</a><a href="cart.html">Сабад</a>
    </nav>
    <p class="footer__copy">© 2026 Namuna Shop</p>
  </div>`;

  /* Drawer-и сабад */
  document.body.insertAdjacentHTML("beforeend", `
  <aside class="drawer layer" id="cartDrawer" role="dialog" aria-modal="true" aria-label="Сабад" aria-hidden="true">
    <div class="drawer__head">
      <h2>Сабад <span class="muted" id="cartDrawerCount"></span></h2>
      <div class="drawer__tools">
        ${iconButton("trash", "Тоза кардани сабад", 'id="cartClearBtn" data-cart-act="clear" hidden')}
        <a class="icon-btn" href="cart.html" aria-label="Саҳифаи сабад" title="Саҳифаи сабад">${icon("expand", 20)}</a>
        ${iconButton("x", "Пӯшидан", "data-close")}
      </div>
    </div>
    <div class="drawer__body" id="cartDrawerBody"></div>
    <div class="drawer__foot" id="cartDrawerFoot" hidden></div>
  </aside>
  <aside class="drawer layer" id="menuDrawer" role="dialog" aria-modal="true" aria-label="Феҳрист" aria-hidden="true">
    <div class="drawer__head"><h2 class="logo">NAMUNA <span>SHOP</span></h2><div class="drawer__tools">${iconButton("x", "Пӯшидан", "data-close")}</div></div>
    <div class="drawer__body">
      <nav class="menu-list" aria-label="Феҳрист">
        <a href="index.html">${icon("home", 20)}Саҳифаи асосӣ</a>
        <a href="catalog.html">${icon("grid", 20)}Каталог</a>
        <a href="catalog.html?filter=new">${icon("sparkle", 20)}Навгониҳо</a>
        <a href="catalog.html?filter=sale">${icon("tag", 20)}Тахфифҳо</a>
        <a href="favorites.html">${icon("heart", 20)}Дӯстдоштаҳо</a>
        <a href="cart.html">${icon("bag", 20)}Сабад</a>
      </nav>
      <div class="menu-cats chips">${CATEGORIES.map(c => `<a class="chip" href="catalog.html?cat=${encodeURIComponent(c)}">${c}</a>`).join("")}</div>
    </div>
    <div class="drawer__foot drawer__foot--row">
      <div class="socials">${socialLinksHTML()}</div>
      <button type="button" class="btn btn--ghost btn--sm" id="installBtn" hidden>${icon("download", 18)} Насб кардани барнома</button>
    </div>
  </aside>`);
}

/* ---------- Нишонаҳои шумора ---------- */
let lastCounts = { cart: -1, fav: -1 };
function updateBadges() {
  const cart = Cart.count(), fav = Favorites.count();
  const apply = (sel, n, key) => $$(sel).forEach(el => {
    el.textContent = n > 99 ? "99+" : n;
    el.hidden = n === 0;
    if (lastCounts[key] !== -1 && lastCounts[key] !== n && n > 0) { el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump"); }
  });
  apply("[data-cart-count]", cart, "cart");
  apply("[data-fav-count]", fav, "fav");
  lastCounts = { cart, fav };
}
function pulseCart() {
  $$("[data-open-cart]").forEach(el => { el.classList.remove("pulse"); void el.offsetWidth; el.classList.add("pulse"); });
}

/* ---------- Корти маҳсулот ---------- */
function productCardHTML(p, i = 0) {
  const first = colorImages(p, 0);
  const alt = first[1];
  const dots = p.colors.slice(0, 4).map((c, ci) =>
    `<button type="button" class="dot-btn${ci === 0 ? " is-active" : ""}" data-card-color="${ci}" aria-label="${escapeHtml(c.name)}" title="${escapeHtml(c.name)}"><i style="background:${colorHex(c)}"></i></button>`
  ).join("") + (p.colors.length > 4 ? `<span class="dots-more">+${p.colors.length - 4}</span>` : "");
  return `<article class="card reveal" style="--i:${i % 8}" data-id="${p.id}">
    <div class="card__media${alt ? " has-alt" : ""}">
      <a class="card__link" href="${productUrl(p)}" aria-label="${escapeHtml(p.name)}">
        ${imgHTML(first[0], p.name, "img-a")}
        ${imgHTML(alt || first[0], "", "img-b", 'aria-hidden="true"')}
      </a>
      <div class="card__badges">${badgesHTML(p)}</div>
      <button type="button" class="icon-btn icon-btn--glass card__fav" data-fav="${p.id}" aria-label="Ба дӯстдоштаҳо" title="Ба дӯстдоштаҳо" aria-pressed="false">${icon("heart", 19)}</button>
      <button type="button" class="icon-btn icon-btn--glass card__quick" data-quick="${p.id}" aria-label="Намоиши зуд" title="Намоиши зуд">${icon("eye", 19)}</button>
      <span class="card__pager" aria-hidden="true"><i></i><i></i></span>
    </div>
    <div class="card__body">
      <h3 class="card__title"><a href="${productUrl(p)}">${escapeHtml(p.name)}</a></h3>
      ${priceHTML(p)}
      <div class="dots">${dots}</div>
    </div>
  </article>`;
}
function renderGrid(el, list, withSkeleton = true) {
  if (!el) return;
  const paint = () => { el.innerHTML = list.map((p, i) => productCardHTML(p, i)).join(""); syncFavButtons(el); observeReveals(el); };
  if (!withSkeleton) { paint(); return; }
  el.innerHTML = skeletonCards(Math.min(list.length || 4, 4));
  setTimeout(paint, 260);
}

/* ---------- Интихоби ранг/андоза (умумӣ барои саҳифа ва намоиши зуд) ---------- */
function swatchesHTML(p, active) {
  return `<div class="swatches" role="radiogroup" aria-label="Ранг">` + p.colors.map((c, i) => {
    const hex = colorHex(c);
    return `<button type="button" class="swatch${i === active ? " is-active" : ""}" role="radio" aria-checked="${i === active}" aria-label="${escapeHtml(c.name)}" title="${escapeHtml(c.name)}" data-color-idx="${i}" style="--sw:${hex};--sw-ink:${isLightColor(hex) ? "#111" : "#fff"}"><span class="swatch__fill"></span>${icon("check", 14)}</button>`;
  }).join("") + `</div>`;
}
function sizeChipsHTML(p, active) {
  return `<div class="size-chips" role="radiogroup" aria-label="Андоза">` + p.sizes.map(s => {
    const sold = (p.soldOutSizes || []).includes(s);
    return `<button type="button" class="size-chip${s === active ? " is-active" : ""}${sold ? " is-sold" : ""}" role="radio" aria-checked="${s === active}" data-size="${escapeHtml(s)}" ${sold ? 'disabled aria-disabled="true" title="Мавҷуд нест"' : `title="${escapeHtml(s)}"`}>${escapeHtml(s)}</button>`;
  }).join("") + `</div>`;
}
function defaultSize(p) {
  const free = p.sizes.filter(s => !(p.soldOutSizes || []).includes(s));
  return p.sizes.length === 1 && free.length === 1 ? free[0] : null;
}
/* Қонеъкунандаи клики ранг/андоза: state-ро нав мекунад ва намоишро ҳамоҳанг месозад */
function selectionHandler(root, p, state, onColor) {
  return e => {
    const sw = e.target.closest("[data-color-idx]");
    if (sw && root.contains(sw)) {
      state.colorIdx = Number(sw.dataset.colorIdx);
      $$("[data-color-idx]", root).forEach(b => {
        const on = Number(b.dataset.colorIdx) === state.colorIdx;
        b.classList.toggle("is-active", on); b.setAttribute("aria-checked", on);
      });
      const nm = $("[data-color-name]", root);
      if (nm) nm.textContent = p.colors[state.colorIdx].name;
      if (onColor) onColor(state.colorIdx);
      return;
    }
    const sz = e.target.closest("[data-size]");
    if (sz && root.contains(sz) && !sz.disabled) {
      state.size = sz.dataset.size;
      $$("[data-size]", root).forEach(b => {
        const on = b.dataset.size === state.size;
        b.classList.toggle("is-active", on); b.setAttribute("aria-checked", on);
      });
    }
  };
}
function bindSelection(root, p, state, onColor) {
  root.addEventListener("click", selectionHandler(root, p, state, onColor));
}
/* Ба сабад илова мекунад; агар андоза интихоб нашуда бошад, огоҳӣ медиҳад */
function addSelectedToCart(p, state, qty, root) {
  if (!state.size) {
    const row = $(".size-chips", root);
    if (row) { row.classList.remove("shake"); void row.offsetWidth; row.classList.add("shake"); row.scrollIntoView({ block: "center", behavior: "smooth" }); }
    toast("Андозаро интихоб кунед", "info");
    return false;
  }
  Cart.add(p.id, p.colors[state.colorIdx].name, state.size, qty);
  toast("Ба сабад илова шуд");
  pulseCart();
  return true;
}

/* ---------- Намоиши зуд ---------- */
const QuickView = {
  el: null, p: null, state: null,
  build() {
    const el = document.createElement("div");
    el.className = "sheet sheet--wide layer";
    el.id = "quickView";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.setAttribute("aria-label", "Намоиши зуд");
    el.setAttribute("aria-hidden", "true");
    document.body.appendChild(el);
    this.el = el;
  },
  open(id) {
    const p = getProduct(id);
    if (!p) return;
    this.p = p;
    this.state = { colorIdx: 0, size: defaultSize(p) };
    const colorName = p.colors[0].name;
    this.el.innerHTML = `
      <div class="sheet__grab" aria-hidden="true"></div>
      ${iconButton("x", "Пӯшидан", "data-close", "icon-btn icon-btn--glass sheet__close")}
      <div class="qv">
        <div class="qv__media">${imgHTML(colorImages(p, 0)[0], p.name, "", 'id="qvImg" loading="eager"')}<div class="card__badges">${badgesHTML(p, 3)}</div></div>
        <div class="qv__info">
          <h2 class="qv__title">${escapeHtml(p.name)}</h2>
          ${priceHTML(p, "price--lg")}
          <div class="opt"><div class="opt__row"><span class="opt__label">Ранг</span><span class="opt__value" data-color-name>${escapeHtml(colorName)}</span></div>${swatchesHTML(p, 0)}</div>
          <div class="opt"><div class="opt__row"><span class="opt__label">Андоза</span></div>${sizeChipsHTML(p, this.state.size)}</div>
          <div class="qv__actions">
            <button type="button" class="btn btn--gold" data-qv-add>Ба сабад ${icon("plus", 18)}</button>
            <button type="button" class="icon-btn icon-btn--outline" data-fav="${p.id}" aria-label="Ба дӯстдоштаҳо" title="Ба дӯстдоштаҳо" aria-pressed="false">${icon("heart", 22)}</button>
          </div>
          <a class="link-arrow" href="${productUrl(p)}">Ба саҳифаи маҳсулот ${icon("arrowRight", 16)}</a>
        </div>
      </div>`;
    this.bind($("#qvImg", this.el));
    syncFavButtons(this.el);
    Layers.open(this.el);
  },
  /* Шунавандаҳои кушодани пешина тоза карда мешаванд, то такрор нашаванд */
  bind(img) {
    const el = this.el, p = this.p, state = this.state;
    if (el._handlers) el._handlers.forEach(h => el.removeEventListener("click", h));
    const onColor = ci => { img.classList.remove("is-placeholder"); img.src = colorImages(p, ci)[0]; };
    const onSelect = selectionHandler(el, p, state, onColor);
    const onAdd = e => { if (e.target.closest("[data-qv-add]") && addSelectedToCart(p, state, 1, el)) Layers.close(el); };
    el.addEventListener("click", onSelect);
    el.addEventListener("click", onAdd);
    el._handlers = [onSelect, onAdd];
  }
};

/* ---------- Саҳифаи асосӣ ---------- */
function initHome() {
  const sets = [["#featuredGrid", PRODUCTS.filter(p => p.featured).slice(0, 8)],
                ["#newGrid", PRODUCTS.filter(p => p.newArrival).slice(0, 4)],
                ["#saleGrid", PRODUCTS.filter(isOnSale).slice(0, 4)]];
  sets.forEach(([sel, list]) => {
    const el = $(sel), sect = el && el.closest("section");
    if (!list.length) { if (sect) sect.hidden = true; return; }
    renderGrid(el, list);
  });
  if (!PRODUCTS.length) {
    const first = $("#featuredGrid"), sect = first && first.closest("section");
    if (sect) {
      sect.hidden = false;
      sect.innerHTML = '<div class="section__head"><h2 class="section__title">Маҳсулот</h2></div><p class="muted" style="padding:24px 0;text-align:center">Ҳоло маҳсулот нест. Ба наздикӣ маҳсулоти нав илова мешавад.</p>';
    }
  }
  const recent = Recent.list().map(getProduct).filter(Boolean).slice(0, 4);
  const sec = $("#recentSection");
  if (sec && recent.length) { sec.hidden = false; renderGrid($("#recentGrid"), recent, false); }
}

/* ---------- Ҳодисаҳои умумӣ ---------- */
function bindGlobalEvents() {
  document.addEventListener("click", e => {
    /* Дил */
    const fav = e.target.closest("[data-fav]");
    if (fav) {
      const on = Favorites.toggle(fav.dataset.fav);
      syncFavButtons();
      $$(`[data-fav="${fav.dataset.fav}"]`).forEach(b => { b.classList.remove("pop"); void b.offsetWidth; b.classList.add("pop"); });
      toast(on ? "Ба дӯстдоштаҳо илова шуд" : "Аз дӯстдоштаҳо нест шуд", on ? "heart" : "trash");
      return;
    }
    /* Намоиши зуд */
    const quick = e.target.closest("[data-quick]");
    if (quick) { QuickView.open(quick.dataset.quick); return; }
    /* Рангҳои корт */
    const dot = e.target.closest("[data-card-color]");
    if (dot) {
      const card = dot.closest(".card"), p = getProduct(card.dataset.id), ci = Number(dot.dataset.cardColor);
      const imgs = colorImages(p, ci), a = $(".img-a", card), b = $(".img-b", card);
      a.classList.remove("is-placeholder"); a.src = imgs[0];
      b.classList.remove("is-placeholder"); b.src = imgs[1] || imgs[0];
      const media = $(".card__media", card);
      media.classList.toggle("has-alt", !!imgs[1]);
      if (!imgs[1]) media.classList.remove("alt");
      $$(".card__link, .card__title a", card).forEach(l => { l.href = productUrl(p, ci); });
      $$("[data-card-color]", card).forEach(d => d.classList.toggle("is-active", d === dot));
      return;
    }
    /* Сабад */
    const cartLink = e.target.closest("[data-open-cart]");
    if (cartLink) {
      e.preventDefault();
      if (document.body.dataset.page === "cart") { window.scrollTo({ top: 0, behavior: "smooth" }); return; }
      Layers.closeAll();
      Layers.open($("#cartDrawer"));
      return;
    }
    if (e.target.closest("[data-open-menu]")) { Layers.open($("#menuDrawer")); return; }
    const off = e.target.closest("[data-social-off]");
    if (off) toast(off.dataset.socialOff + ": ҳоло танзим нашудааст", "info");
  });

  /* Корт: swipe барои иваз кардани расм (мобилӣ) */
  let touch = null;
  document.addEventListener("touchstart", e => {
    const m = e.target.closest(".card__media");
    touch = m && e.touches.length === 1 ? { m, x: e.touches[0].clientX, y: e.touches[0].clientY } : null;
  }, { passive: true });
  document.addEventListener("touchend", e => {
    if (!touch) return;
    const t = e.changedTouches[0], dx = t.clientX - touch.x, dy = t.clientY - touch.y;
    if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy) * 1.3 && touch.m.classList.contains("has-alt")) {
      touch.m.classList.toggle("alt", dx < 0);
      touch.m.dataset.swiped = "1";
      const m = touch.m;
      setTimeout(() => { delete m.dataset.swiped; }, 350);
    }
    touch = null;
  }, { passive: true });
  document.addEventListener("click", e => {
    const m = e.target.closest(".card__media");
    if (m && m.dataset.swiped) { e.preventDefault(); e.stopPropagation(); }
  }, true);

  /* Header: эффекти шиша ҳангоми скролл */
  const header = $("#siteHeader");
  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 8);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Нав кардани нишонаҳо */
  document.addEventListener("cart:changed", updateBadges);
  document.addEventListener("favorites:changed", updateBadges);
  window.addEventListener("storage", () => { updateBadges(); syncFavButtons(); renderCartViews(); });
}

/* ---------- PWA ---------- */
function initPWA() {
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    window.addEventListener("load", () => navigator.serviceWorker.register("service-worker.js").catch(() => {}));
  }
  let deferred = null;
  window.addEventListener("beforeinstallprompt", e => {
    e.preventDefault(); deferred = e;
    const btn = $("#installBtn"); if (btn) btn.hidden = false;
  });
  document.addEventListener("click", async e => {
    if (!e.target.closest("#installBtn") || !deferred) return;
    deferred.prompt(); await deferred.userChoice.catch(() => {}); deferred = null;
    $("#installBtn").hidden = true;
  });
}

/* Нишонаҳои статикии HTML (<i data-icon="...">) бо SVG пур мешаванд */
function hydrateIcons(root = document) {
  $$("[data-icon]:not([data-ready])", root).forEach(el => {
    el.innerHTML = icon(el.dataset.icon, Number(el.dataset.size) || 22);
    el.setAttribute("data-ready", "1");
  });
}

/* ---------- Оғоз ---------- */
(function init() {
  Layers.init();
  initCart();
  buildLayout();
  initSearch();
  QuickView.build();
  renderCartViews();
  updateBadges();
  bindGlobalEvents();
  initPWA();
  if (document.body.dataset.page === "home") initHome();
  if (typeof initFavoritesPage === "function") initFavoritesPage();
  hydrateIcons();
  syncFavButtons();
  observeReveals();
})();
