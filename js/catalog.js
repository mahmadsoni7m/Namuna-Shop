"use strict";
/* ==========================================================
   NAMUNA SHOP — саҳифаи каталог: филтр, ҷудокунӣ, ҷустуҷӯ
   ========================================================== */
(function () {
  const grid = $("#catalogGrid");
  if (!grid) return;

  const SORTS = [
    { id: "new", label: "Навтарин" },
    { id: "priceAsc", label: "Арзонтарин" },
    { id: "priceDesc", label: "Қиматтарин" },
    { id: "popular", label: "Машҳуртарин" },
    { id: "rating", label: "Баҳои баландтарин" }
  ];
  const PRICE_MAX = Math.ceil(Math.max(50, ...PRODUCTS.map(p => p.price)) / 50) * 50;
  const COLOR_NAMES = [...new Set(PRODUCTS.flatMap(p => p.colors.map(c => c.name)))];
  const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL"];
  const SIZE_NAMES = [...new Set(PRODUCTS.flatMap(p => p.sizes))].sort((a, b) => {
    const ia = SIZE_ORDER.indexOf(a), ib = SIZE_ORDER.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
  const RATINGS = [4, 4.5, 4.8];

  const state = { q: "", cats: [], colors: [], sizes: [], maxPrice: PRICE_MAX, sale: false, news: false, minRating: 0, sort: Prefs.get("sort", "new") };
  if (!SORTS.some(s => s.id === state.sort)) state.sort = "new";

  /* Аз URL: ?cat=…&filter=new|sale&q=… */
  (function readUrl() {
    const cat = getParam("cat"), f = getParam("filter"), q = getParam("q");
    if (cat && CATEGORIES.includes(cat)) state.cats = [cat];
    if (f === "new") state.news = true;
    if (f === "sale") state.sale = true;
    if (q) state.q = q.trim();
    const title = state.news ? "Навгониҳо" : state.sale ? "Тахфифҳо" : state.cats[0] || (state.q ? "Ҷустуҷӯ" : "Каталог");
    $("#catalogTitle").textContent = title;
    document.title = title + " — NAMUNA SHOP";
  })();

  const filterPanel = $("#filterPanel"), sortSheet = $("#sortSheet");

  /* ---------- Филтр ва ҷудокунӣ ---------- */
  function getFiltered() {
    const qIds = state.q ? new Set(searchProducts(state.q).map(p => p.id)) : null;
    const list = PRODUCTS.filter(p =>
      (!qIds || qIds.has(p.id)) &&
      (!state.cats.length || state.cats.includes(p.category)) &&
      (!state.colors.length || p.colors.some(c => state.colors.includes(c.name))) &&
      (!state.sizes.length || p.sizes.some(s => state.sizes.includes(s))) &&
      p.price <= state.maxPrice &&
      (!state.sale || isOnSale(p)) &&
      (!state.news || p.newArrival) &&
      p.rating >= state.minRating
    );
    const by = {
      new: (a, b) => b.id - a.id,
      priceAsc: (a, b) => a.price - b.price,
      priceDesc: (a, b) => b.price - a.price,
      popular: (a, b) => b.reviews - a.reviews,
      rating: (a, b) => b.rating - a.rating || b.reviews - a.reviews
    }[state.sort];
    return list.sort(by);
  }
  function activeFilters() {
    const list = [];
    if (state.q) list.push({ label: "«" + state.q + "»", remove: () => { state.q = ""; } });
    state.cats.forEach(c => list.push({ label: c, remove: () => { state.cats = state.cats.filter(x => x !== c); } }));
    state.colors.forEach(c => list.push({ label: c, remove: () => { state.colors = state.colors.filter(x => x !== c); } }));
    state.sizes.forEach(s => list.push({ label: s, remove: () => { state.sizes = state.sizes.filter(x => x !== s); } }));
    if (state.maxPrice < PRICE_MAX) list.push({ label: "то " + formatPrice(state.maxPrice), remove: () => { state.maxPrice = PRICE_MAX; } });
    if (state.sale) list.push({ label: "Тахфиф", remove: () => { state.sale = false; } });
    if (state.news) list.push({ label: "Навгониҳо", remove: () => { state.news = false; } });
    if (state.minRating) list.push({ label: state.minRating + "+", remove: () => { state.minRating = 0; } });
    return list;
  }
  function resetFilters() {
    Object.assign(state, { q: "", cats: [], colors: [], sizes: [], maxPrice: PRICE_MAX, sale: false, news: false, minRating: 0 });
  }

  /* ---------- Намоиш ---------- */
  function render(skeleton = false) {
    const list = getFiltered();
    const active = activeFilters();
    $("#catalogCount").textContent = list.length + " маҳсулот";
    const badge = $("#filterBadge");
    badge.textContent = active.filter(a => !a.label.startsWith("«")).length;
    badge.hidden = badge.textContent === "0";
    $("#filterShow").innerHTML = `Намоиш: ${list.length}`;

    const chips = $("#activeChips");
    chips.hidden = active.length === 0;
    chips.innerHTML = active.map((a, i) => `<button type="button" class="chip chip--active" data-remove="${i}" aria-label="Нест кардан: ${escapeHtml(a.label)}" title="Нест кардан">${escapeHtml(a.label)} ${icon("x", 14)}</button>`).join("") +
      (active.length > 1 ? `<button type="button" class="chip chip--ghost" data-reset>Тоза кардан</button>` : "");
    chips._active = active;

    const paint = () => {
      if (!list.length) {
        grid.className = "";
        grid.innerHTML = `<div class="empty"><div class="empty__icon">${icon("search", 44)}</div><p class="empty__title">Маҳсулот ёфт нашуд</p>
          ${active.length ? `<button type="button" class="btn btn--ghost" data-reset>Тоза кардани филтрҳо</button>` : ""}</div>`;
        return;
      }
      grid.className = "product-grid";
      grid.innerHTML = list.map((p, i) => productCardHTML(p, i)).join("");
      syncFavButtons(grid);
      observeReveals(grid);
    };
    if (skeleton) { grid.className = "product-grid"; grid.innerHTML = skeletonCards(8); setTimeout(paint, 280); } else paint();
    syncPanel();
  }

  /* ---------- Панели филтр ---------- */
  const chip = (group, value, label, extra = "") =>
    `<button type="button" class="chip" data-chip="${group}" data-value="${escapeHtml(value)}" aria-pressed="false">${extra}${escapeHtml(label)}</button>`;

  function buildPanel() {
    filterPanel.innerHTML = `
      <div class="sheet__grab" aria-hidden="true"></div>
      <div class="sheet__head"><h2>Филтр</h2><div class="drawer__tools">
        ${iconButton("trash", "Тоза кардан", "data-reset")}${iconButton("x", "Пӯшидан", "data-close")}</div></div>
      <div class="sheet__body">
        <section class="fgroup"><h3>Категория</h3><div class="chips">${CATEGORIES.map(c => chip("cats", c, c)).join("")}</div></section>
        <section class="fgroup"><h3>Нарх</h3>
          <div class="range"><input type="range" id="priceRange" min="0" max="${PRICE_MAX}" step="10" value="${PRICE_MAX}" aria-label="Нархи ниҳоӣ">
          <output id="priceOut" for="priceRange"></output></div></section>
        <section class="fgroup"><h3>Ранг</h3><div class="swatches swatches--panel">${COLOR_NAMES.map(n => {
          const hex = COLOR_HEX[n] || "#777";
          return `<button type="button" class="swatch swatch--sm" data-chip="colors" data-value="${escapeHtml(n)}" aria-label="${escapeHtml(n)}" title="${escapeHtml(n)}" aria-pressed="false" style="--sw:${hex};--sw-ink:${isLightColor(hex) ? "#111" : "#fff"}"><span class="swatch__fill"></span>${icon("check", 14)}</button>`;
        }).join("")}</div></section>
        <section class="fgroup"><h3>Андоза</h3><div class="chips">${SIZE_NAMES.map(s => chip("sizes", s, s)).join("")}</div></section>
        <section class="fgroup"><h3>Баҳо</h3><div class="chips">${RATINGS.map(r => chip("rating", String(r), r + "+", icon("star", 14, "star is-full"))).join("")}</div></section>
        <section class="fgroup fgroup--switches">
          <label class="switch"><input type="checkbox" data-switch="sale"><span class="switch__track"></span><span>Тахфиф</span></label>
          <label class="switch"><input type="checkbox" data-switch="news"><span class="switch__track"></span><span>Навгониҳо</span></label>
        </section>
      </div>
      <div class="sheet__foot"><button type="button" class="btn btn--gold btn--block" id="filterShow" data-close>Намоиш</button></div>`;
  }
  function syncPanel() {
    $$("[data-chip]", filterPanel).forEach(b => {
      const g = b.dataset.chip, v = b.dataset.value;
      const on = g === "rating" ? String(state.minRating) === v : state[g].includes(v);
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", on);
    });
    $$("[data-switch]", filterPanel).forEach(i => { i.checked = !!state[i.dataset.switch]; });
    const r = $("#priceRange");
    r.value = state.maxPrice;
    r.style.setProperty("--pct", (state.maxPrice / PRICE_MAX * 100) + "%");
    $("#priceOut").textContent = "то " + formatPrice(state.maxPrice);
  }
  function toggleIn(arr, v) { return arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]; }

  buildPanel();
  filterPanel.addEventListener("click", e => {
    const c = e.target.closest("[data-chip]");
    if (c) {
      const g = c.dataset.chip, v = c.dataset.value;
      if (g === "rating") state.minRating = String(state.minRating) === v ? 0 : Number(v);
      else state[g] = toggleIn(state[g], v);
      render();
      return;
    }
    if (e.target.closest("[data-reset]")) { resetFilters(); render(); }
  });
  filterPanel.addEventListener("change", e => {
    const sw = e.target.closest("[data-switch]");
    if (sw) { state[sw.dataset.switch] = sw.checked; render(); }
  });
  $("#priceRange").addEventListener("input", e => { state.maxPrice = Number(e.target.value); render(); });

  /* ---------- Ҷудокунӣ ---------- */
  function buildSort() {
    sortSheet.innerHTML = `<div class="sheet__grab" aria-hidden="true"></div>
      <div class="sheet__head"><h2>Ҷудокунӣ</h2><div class="drawer__tools">${iconButton("x", "Пӯшидан", "data-close")}</div></div>
      <div class="sheet__body"><div class="sort-list" role="radiogroup" aria-label="Ҷудокунӣ">${SORTS.map(s =>
        `<button type="button" class="sort-opt" role="radio" aria-checked="false" data-sort="${s.id}"><span>${s.label}</span>${icon("check", 18)}</button>`).join("")}</div></div>`;
  }
  function syncSort() {
    $$("[data-sort]", sortSheet).forEach(b => {
      const on = b.dataset.sort === state.sort;
      b.classList.toggle("is-active", on); b.setAttribute("aria-checked", on);
    });
  }
  buildSort(); syncSort();
  sortSheet.addEventListener("click", e => {
    const b = e.target.closest("[data-sort]");
    if (!b) return;
    state.sort = b.dataset.sort;
    Prefs.set("sort", state.sort);
    syncSort(); render();
    setTimeout(() => Layers.close(sortSheet), 140);
  });

  /* ---------- Тугмаҳои болои саҳифа ---------- */
  $("#openFilter").addEventListener("click", () => Layers.open(filterPanel));
  $("#openSort").addEventListener("click", () => Layers.open(sortSheet));
  $("#activeChips").addEventListener("click", e => {
    if (e.target.closest("[data-reset]")) { resetFilters(); render(); return; }
    const b = e.target.closest("[data-remove]");
    if (b) { $("#activeChips")._active[Number(b.dataset.remove)].remove(); render(); }
  });
  grid.addEventListener("click", e => { if (e.target.closest("[data-reset]")) { resetFilters(); render(); } });

  render(true);
})();
