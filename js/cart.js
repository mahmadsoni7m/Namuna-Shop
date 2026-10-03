"use strict";
/* ==========================================================
   NAMUNA SHOP — сабад (localStorage)
   Ҳар сатр: { key, id, color (ном), size, qty }
   ========================================================== */

const Cart = {
  MAX_QTY: 20,
  items() { return Store.get(KEYS.cart, []); },
  save(items) {
    Store.set(KEYS.cart, items);
    document.dispatchEvent(new CustomEvent("cart:changed"));
  },
  keyOf(id, color, size) { return `${id}|${color}|${size}`; },
  add(id, color, size, qty = 1) {
    const items = this.items();
    const key = this.keyOf(id, color, size);
    const found = items.find(i => i.key === key);
    if (found) found.qty = Math.min(this.MAX_QTY, found.qty + qty);
    else items.push({ key, id: Number(id), color, size, qty: Math.min(this.MAX_QTY, qty) });
    this.save(items);
  },
  setQty(key, qty) {
    const items = this.items();
    const item = items.find(i => i.key === key);
    if (!item) return;
    item.qty = Math.max(1, Math.min(this.MAX_QTY, qty));
    this.save(items);
  },
  remove(key) { this.save(this.items().filter(i => i.key !== key)); },
  clear() { this.save([]); },
  /* Сатрҳо бо маълумоти пурраи маҳсулот (маҳсулоти нопадидшуда ҳазф мешавад) */
  detailed() {
    return this.items().map(i => {
      const product = getProduct(i.id);
      if (!product) return null;
      const colorIdx = Math.max(0, product.colors.findIndex(c => c.name === i.color));
      return { ...i, product, colorIdx, image: colorImages(product, colorIdx)[0], lineTotal: product.price * i.qty };
    }).filter(Boolean);
  },
  count() { return this.detailed().reduce((s, i) => s + i.qty, 0); },
  total() { return this.detailed().reduce((s, i) => s + i.lineTotal, 0); }
};

/* ---------- Намоиши сабад ---------- */
function cartLineHTML(line) {
  const p = line.product;
  const hex = colorHex(p.colors[line.colorIdx] || { name: line.color });
  return `<article class="cart-line" data-key="${escapeHtml(line.key)}">
    <a class="cart-line__img" href="${productUrl(p, line.colorIdx)}" aria-label="${escapeHtml(p.name)}">
      ${imgHTML(line.image, p.name)}
    </a>
    <div class="cart-line__info">
      <a class="cart-line__name" href="${productUrl(p, line.colorIdx)}">${escapeHtml(p.name)}</a>
      <div class="cart-line__meta">
        <span class="meta-chip"><i class="dot" style="background:${hex}"></i>${escapeHtml(line.color)}</span>
        <span class="meta-chip">${escapeHtml(line.size)}</span>
      </div>
      <div class="cart-line__bottom">
        <div class="qty qty--sm" role="group" aria-label="Миқдор">
          <button type="button" aria-label="Кам кардан" title="Кам кардан" data-cart-act="dec" ${line.qty <= 1 ? "disabled" : ""}>${icon("minus", 16)}</button>
          <span aria-live="polite">${line.qty}</span>
          <button type="button" aria-label="Зиёд кардан" title="Зиёд кардан" data-cart-act="inc" ${line.qty >= Cart.MAX_QTY ? "disabled" : ""}>${icon("plus", 16)}</button>
        </div>
        <strong class="cart-line__price">${formatPrice(line.lineTotal)}</strong>
      </div>
    </div>
    <button type="button" class="icon-btn icon-btn--sm cart-line__del" aria-label="Нест кардан" title="Нест кардан" data-cart-act="remove">${icon("trash", 18)}</button>
  </article>`;
}
function cartEmptyHTML() {
  return `<div class="empty">
    <div class="empty__icon">${icon("bag", 44)}</div>
    <p class="empty__title">Сабад холӣ аст.</p>
    <a class="btn btn--gold" href="catalog.html" data-close>Ба каталог ${icon("arrowRight", 18)}</a>
  </div>`;
}
function cartTotalHTML(withButton = true) {
  return `<div class="cart-total"><span>Ҳамагӣ</span><strong>${formatPrice(Cart.total())}</strong></div>
    ${withButton ? `<a class="btn btn--gold btn--block" href="checkout.html">Харидан ${icon("arrowRight", 18)}</a>` : ""}`;
}

function renderCartViews() {
  const lines = Cart.detailed();
  const empty = lines.length === 0;
  /* Drawer */
  const body = $("#cartDrawerBody");
  if (body) {
    body.innerHTML = empty ? cartEmptyHTML() : lines.map(cartLineHTML).join("");
    const foot = $("#cartDrawerFoot");
    foot.innerHTML = empty ? "" : cartTotalHTML(true);
    foot.hidden = empty;
    const c = $("#cartDrawerCount");
    if (c) c.textContent = empty ? "" : "(" + Cart.count() + ")";
    const clr = $("#cartClearBtn");
    if (clr) clr.hidden = empty;
  }
  /* Саҳифаи сабад */
  const page = $("#cartPage");
  if (page) {
    page.classList.toggle("cart-page", !empty);
    if (empty) page.innerHTML = cartEmptyHTML();
    else page.innerHTML = `<div class="cart-page__list">${lines.map(cartLineHTML).join("")}</div>
      <aside class="cart-page__summary"><div class="summary-card">${cartTotalHTML(true)}
      <button type="button" class="btn btn--ghost btn--block" data-cart-act="clear">${icon("trash", 18)} Тоза кардани сабад</button></div></aside>`;
  }
}

function handleCartClick(e) {
  const btn = e.target.closest("[data-cart-act]");
  if (!btn) return;
  const act = btn.dataset.cartAct;
  if (act === "clear") {
    if (confirm("Сабад тоза карда шавад?")) Cart.clear();
    return;
  }
  const row = btn.closest("[data-key]");
  if (!row) return;
  const key = row.dataset.key;
  const item = Cart.items().find(i => i.key === key);
  if (!item) return;
  if (act === "inc") Cart.setQty(key, item.qty + 1);
  if (act === "dec") Cart.setQty(key, item.qty - 1);
  if (act === "remove") Cart.remove(key);
}

function initCart() {
  document.addEventListener("click", handleCartClick);
  document.addEventListener("cart:changed", renderCartViews);
}
