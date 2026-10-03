"use strict";
/* ==========================================================
   NAMUNA SHOP — ҷустуҷӯи фаврӣ (номи маҳсулот, категория, ранг)
   ========================================================== */

function searchProducts(query) {
  const tokens = normalizeText(query).split(/\s+/).filter(Boolean);
  if (!tokens.length) return [];
  return PRODUCTS.filter(p => {
    const haystack = normalizeText([p.name, p.category, ...p.colors.map(c => c.name)].join(" "));
    return tokens.every(t => haystack.includes(t));
  });
}

const SearchUI = {
  el: null, input: null, results: null,
  build() {
    const wrap = document.createElement("div");
    wrap.className = "search-overlay layer";
    wrap.id = "searchOverlay";
    wrap.setAttribute("role", "dialog");
    wrap.setAttribute("aria-modal", "true");
    wrap.setAttribute("aria-label", "Ҷустуҷӯ");
    wrap.setAttribute("aria-hidden", "true");
    wrap.innerHTML = `
      <div class="search-overlay__bar">
        <form class="search-form" action="catalog.html" method="get" role="search">
          ${icon("search", 22)}
          <input type="search" name="q" id="searchInput" placeholder="Ҷустуҷӯ..." autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Ҷустуҷӯ" data-autofocus>
          <button type="button" class="icon-btn icon-btn--sm" id="searchClear" aria-label="Тоза кардан" title="Тоза кардан" hidden>${icon("x", 18)}</button>
        </form>
        ${iconButton("x", "Пӯшидан", "data-close")}
      </div>
      <div class="search-overlay__body" id="searchResults"></div>`;
    document.body.appendChild(wrap);
    this.el = wrap;
    this.input = $("#searchInput", wrap);
    this.results = $("#searchResults", wrap);
    const clearBtn = $("#searchClear", wrap);
    this.input.addEventListener("input", debounce(() => this.run(), 90));
    this.input.addEventListener("input", () => { clearBtn.hidden = !this.input.value; });
    clearBtn.addEventListener("click", () => { this.input.value = ""; clearBtn.hidden = true; this.run(); this.input.focus(); });
    this.results.addEventListener("click", e => {
      const chip = e.target.closest("[data-suggest]");
      if (chip) { this.input.value = chip.dataset.suggest; clearBtn.hidden = false; this.run(); this.input.focus(); }
      if (e.target.closest("a")) Layers.close(this.el);
    });
    this.run();
  },
  open() { Layers.open(this.el); },
  run() {
    const q = this.input.value.trim();
    if (!q) {
      const colors = [...new Set(PRODUCTS.flatMap(p => p.colors.map(c => c.name)))];
      this.results.innerHTML = `<div class="search-hint">
        <div class="chips">${CATEGORIES.concat(colors).map(s => `<button type="button" class="chip" data-suggest="${escapeHtml(s)}">${escapeHtml(s)}</button>`).join("")}</div></div>`;
      return;
    }
    const found = searchProducts(q);
    if (!found.length) {
      this.results.innerHTML = `<div class="empty empty--compact">
        <div class="empty__icon">${icon("search", 40)}</div><p class="empty__title">Маҳсулот ёфт нашуд</p></div>`;
      return;
    }
    const rows = found.slice(0, 8).map(p => `
      <a class="search-row" href="${productUrl(p)}">
        <span class="search-row__img">${imgHTML(colorImages(p)[0], p.name)}</span>
        <span class="search-row__info"><strong>${escapeHtml(p.name)}</strong><small>${escapeHtml(p.category)}</small></span>
        ${priceHTML(p, "price--sm")}
      </a>`).join("");
    const more = found.length > 8 ? `<a class="btn btn--ghost btn--block" href="catalog.html?q=${encodeURIComponent(q)}">Ҳама (${found.length}) ${icon("arrowRight", 18)}</a>` : "";
    this.results.innerHTML = `<div class="search-list">${rows}</div>${more}`;
  }
};

function initSearch() {
  SearchUI.build();
  document.addEventListener("click", e => {
    if (e.target.closest("[data-open-search]")) { e.preventDefault(); SearchUI.open(); }
  });
}
