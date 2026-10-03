"use strict";
/* ==========================================================
   NAMUNA SHOP — дӯстдоштаҳо + «Ба наздикӣ дидашуда»
   ========================================================== */

const Favorites = {
  list() { return Store.get(KEYS.favorites, []); },
  has(id) { return this.list().includes(Number(id)); },
  count() { return this.list().length; },
  toggle(id) {
    id = Number(id);
    const list = this.list();
    const on = !list.includes(id);
    Store.set(KEYS.favorites, on ? [id, ...list] : list.filter(x => x !== id));
    document.dispatchEvent(new CustomEvent("favorites:changed", { detail: { id, on } }));
    return on;
  }
};

const Recent = {
  LIMIT: 10,
  list() { return Store.get(KEYS.recent, []); },
  add(id) {
    id = Number(id);
    Store.set(KEYS.recent, [id, ...this.list().filter(x => x !== id)].slice(0, this.LIMIT));
  }
};

/* Тугмаҳои дил (♡ / ♥)-ро бо ҳолати ҳозира ҳамоҳанг мекунад */
function syncFavButtons(root = document) {
  $$("[data-fav]", root).forEach(btn => {
    const on = Favorites.has(btn.dataset.fav);
    const label = on ? "Аз дӯстдоштаҳо нест кардан" : "Ба дӯстдоштаҳо";
    btn.classList.toggle("is-active", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    btn.setAttribute("aria-label", label);
    btn.title = label;
  });
}

/* ---------- Саҳифаи дӯстдоштаҳо ---------- */
function renderFavoritesPage() {
  const grid = $("#favoritesGrid");
  if (!grid) return;
  const items = Favorites.list().map(getProduct).filter(Boolean);
  const countEl = $("#favoritesCount");
  if (countEl) countEl.textContent = items.length ? items.length + " маҳсулот" : "";
  if (!items.length) {
    grid.className = "";
    grid.innerHTML = `<div class="empty">
      <div class="empty__icon">${icon("heart", 44)}</div>
      <p class="empty__title">Ҳоло маҳсулоти дӯстдошта нест.</p>
      <a class="btn btn--gold" href="catalog.html">Ба каталог ${icon("arrowRight", 18)}</a>
    </div>`;
    return;
  }
  grid.className = "product-grid";
  grid.innerHTML = items.map((p, i) => productCardHTML(p, i)).join("");
  syncFavButtons(grid);
  observeReveals(grid);
}

function initFavoritesPage() {
  if (!$("#favoritesGrid")) return;
  renderFavoritesPage();
  /* Вақте маҳсулот аз рӯйхат гирифта мешавад, рӯйхатро нав мекунем */
  document.addEventListener("favorites:changed", () => setTimeout(renderFavoritesPage, 260));
}
