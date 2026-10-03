"use strict";
/* ==========================================================
   NAMUNA SHOP — саҳифаи маҳсулот
   ========================================================== */
(function () {
  const root = $("#productRoot");
  if (!root) return;

  const p = getProduct(getParam("id"));
  if (!p) { location.replace("404.html"); return; }

  const startColor = Number(getParam("c"));
  const state = {
    colorIdx: startColor >= 0 && startColor < p.colors.length ? startColor : 0,
    imgIdx: 0,
    size: defaultSize(p),
    qty: 1
  };
  const images = () => colorImages(p, state.colorIdx);

  /* Мета-маълумот */
  document.title = p.name + " — NAMUNA SHOP";
  const metaDesc = $('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute("content", p.description);
  const ogTitle = $('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute("content", p.name + " — NAMUNA SHOP");

  /* Маҳсулоти дидашудаи пешин (пеш аз илова кардани ҳозира) */
  const recentList = Recent.list().filter(id => id !== p.id).map(getProduct).filter(Boolean).slice(0, 4);
  Recent.add(p.id);

  const similar = PRODUCTS.filter(x => x.id !== p.id && x.category === p.category).slice(0, 4);
  const similarIds = new Set(similar.map(x => x.id));
  const alsoLike = PRODUCTS.filter(x => x.id !== p.id && !similarIds.has(x.id))
    .sort((a, b) => (b.featured - a.featured) || (b.rating - a.rating)).slice(0, 4);

  const reviews = getReviews(p, 3);
  const initials = n => n.trim().charAt(0).toUpperCase();

  root.innerHTML = `
    <nav class="breadcrumb" aria-label="Роҳ">
      <a href="index.html">Саҳифаи асосӣ</a>${icon("chevRight", 14)}
      <a href="catalog.html?cat=${encodeURIComponent(p.category)}">${escapeHtml(p.category)}</a>${icon("chevRight", 14)}
      <span aria-current="page">${escapeHtml(p.name)}</span>
    </nav>
    <div class="pdp">
      <div class="gallery" id="gallery">
        <div class="gallery__stage" id="stage" tabindex="0" aria-label="Галереяи расмҳо">
          ${imgHTML(images()[0], p.name, "gallery__img", 'id="mainImg" loading="eager" fetchpriority="high"')}
          <div class="card__badges">${badgesHTML(p, 3)}</div>
          ${iconButton("chevLeft", "Расми пешина", 'data-gal="-1"', "icon-btn icon-btn--glass gallery__nav gallery__nav--prev")}
          ${iconButton("chevRight", "Расми оянда", 'data-gal="1"', "icon-btn icon-btn--glass gallery__nav gallery__nav--next")}
          ${iconButton("expand", "Экрани пурра", 'id="openLightbox"', "icon-btn icon-btn--glass gallery__full")}
          <span class="gallery__count" id="galCount"></span>
        </div>
        <div class="gallery__thumbs" id="thumbs"></div>
      </div>
      <div class="pdp__info" id="pdpInfo">
        <p class="pdp__cat">${escapeHtml(p.category)}</p>
        <h1 class="pdp__title">${escapeHtml(p.name)}</h1>
        <a class="rating" href="#reviews" aria-label="Баҳо ва шарҳҳо">${starsHTML(p.rating)}<strong>${p.rating}</strong><span>${p.reviews} баҳогузорӣ</span></a>
        <div class="pdp__price">${priceHTML(p, "price--xl")}${isOnSale(p) ? `<span class="badge badge--sale">−${discountPercent(p)}%</span>` : ""}</div>
        <p class="pdp__desc">${escapeHtml(p.description)}</p>
        <div class="opt"><div class="opt__row"><span class="opt__label">Ранг</span><span class="opt__value" data-color-name>${escapeHtml(p.colors[state.colorIdx].name)}</span></div>${swatchesHTML(p, state.colorIdx)}</div>
        <div class="opt"><div class="opt__row"><span class="opt__label">Андоза</span></div>${sizeChipsHTML(p, state.size)}</div>
        <div class="opt"><div class="opt__row"><span class="opt__label">Миқдор</span></div>
          <div class="qty" role="group" aria-label="Миқдор">
            <button type="button" aria-label="Кам кардан" title="Кам кардан" data-qty="-1" disabled>${icon("minus", 18)}</button>
            <span id="qtyVal" aria-live="polite">1</span>
            <button type="button" aria-label="Зиёд кардан" title="Зиёд кардан" data-qty="1">${icon("plus", 18)}</button>
          </div></div>
        <div class="pdp__actions" id="pdpActions">
          <button type="button" class="btn btn--gold btn--lg" id="buyNow">Харидан ${icon("arrowRight", 20)}</button>
          <button type="button" class="btn btn--outline btn--lg" id="addCart">Ба сабад ${icon("plus", 20)}</button>
          <button type="button" class="icon-btn icon-btn--outline" data-fav="${p.id}" aria-label="Ба дӯстдоштаҳо" title="Ба дӯстдоштаҳо" aria-pressed="false">${icon("heart", 22)}</button>
          <button type="button" class="icon-btn icon-btn--outline" id="shareBtn" aria-label="Мубодила" title="Мубодила">${icon("share", 22)}</button>
        </div>
      </div>
    </div>
    <section class="section" id="reviews" aria-labelledby="reviewsTitle">
      <h2 class="section__title" id="reviewsTitle">Баҳогузорӣ</h2>
      <div class="reviews">
        <div class="reviews__sum"><strong>${p.rating}</strong>${starsHTML(p.rating)}<span>${p.reviews} баҳогузорӣ</span></div>
        <div class="reviews__list">${reviews.map(r => `
          <article class="review"><div class="review__avatar" aria-hidden="true">${escapeHtml(initials(r.name))}</div>
            <div><div class="review__head"><strong>${escapeHtml(r.name)}</strong>${starsHTML(r.rating)}</div><p>${escapeHtml(r.text)}</p></div></article>`).join("")}
          <p class="muted small">Шарҳҳо намунавӣ мебошанд.</p></div>
      </div>
    </section>
    ${similar.length ? `<section class="section"><div class="section__head"><h2 class="section__title">Маҳсулоти монанд</h2></div><div class="product-grid" id="similarGrid"></div></section>` : ""}
    ${alsoLike.length ? `<section class="section"><div class="section__head"><h2 class="section__title">Шояд инҳо ҳам ба шумо писанд оянд</h2></div><div class="product-grid" id="alsoGrid"></div></section>` : ""}
    ${recentList.length ? `<section class="section"><div class="section__head"><h2 class="section__title">Ба наздикӣ дидашуда</h2></div><div class="product-grid" id="recentGrid"></div></section>` : ""}
    <div class="buybar" id="buybar">
      <div class="buybar__price">${priceHTML(p, "price--sm")}</div>
      <button type="button" class="btn btn--gold" id="buyNowBar">Харидан ${icon("arrowRight", 18)}</button>
    </div>`;

  renderGrid($("#similarGrid"), similar, false);
  renderGrid($("#alsoGrid"), alsoLike, false);
  renderGrid($("#recentGrid"), recentList, false);
  syncFavButtons(root);

  /* ---------- Галерея ---------- */
  const main = $("#mainImg"), stage = $("#stage"), thumbs = $("#thumbs"), count = $("#galCount");

  function renderThumbs() {
    const list = images();
    thumbs.hidden = list.length < 2;
    thumbs.innerHTML = list.map((src, i) =>
      `<button type="button" class="thumb${i === state.imgIdx ? " is-active" : ""}" data-thumb="${i}" aria-label="Расми ${i + 1}" ${i === state.imgIdx ? 'aria-current="true"' : ""}>${imgHTML(src, "", "", 'width="120" height="160"')}</button>`
    ).join("");
    $$("[data-gal]", stage).forEach(b => { b.hidden = list.length < 2; });
  }
  function showImage(i, instant = false) {
    const list = images();
    state.imgIdx = (i + list.length) % list.length;
    const apply = () => {
      main.classList.remove("is-placeholder");
      main.src = list[state.imgIdx];
      main.alt = p.name + " — " + p.colors[state.colorIdx].name + " " + (state.imgIdx + 1);
      main.classList.remove("is-fading");
    };
    if (instant) apply(); else { main.classList.add("is-fading"); setTimeout(apply, 140); }
    $$(".thumb", thumbs).forEach((t, k) => { t.classList.toggle("is-active", k === state.imgIdx); if (k === state.imgIdx) t.setAttribute("aria-current", "true"); else t.removeAttribute("aria-current"); });
    count.textContent = list.length > 1 ? (state.imgIdx + 1) + " / " + list.length : "";
    const next = new Image(); next.src = list[(state.imgIdx + 1) % list.length];
  }
  renderThumbs(); showImage(0, true);

  thumbs.addEventListener("click", e => { const t = e.target.closest("[data-thumb]"); if (t) showImage(Number(t.dataset.thumb)); });
  stage.addEventListener("click", e => {
    const nav = e.target.closest("[data-gal]");
    if (nav) { showImage(state.imgIdx + Number(nav.dataset.gal)); return; }
    if (stage.dataset.swiped) return;
    if (e.target.closest("#openLightbox") || e.target.closest(".gallery__img")) openLightbox(state.imgIdx);
  });
  stage.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft") showImage(state.imgIdx - 1);
    if (e.key === "ArrowRight") showImage(state.imgIdx + 1);
  });
  onSwipe(stage, dir => showImage(state.imgIdx + (dir === "left" ? 1 : -1)));
  /* Zoom бо мушак (компютер) */
  stage.addEventListener("mousemove", e => {
    const r = stage.getBoundingClientRect();
    stage.style.setProperty("--zx", ((e.clientX - r.left) / r.width * 100) + "%");
    stage.style.setProperty("--zy", ((e.clientY - r.top) / r.height * 100) + "%");
  });

  /* ---------- Экрани пурра ---------- */
  const lb = document.createElement("div");
  lb.className = "lightbox layer";
  lb.id = "lightbox";
  lb.setAttribute("role", "dialog");
  lb.setAttribute("aria-modal", "true");
  lb.setAttribute("aria-label", "Расм");
  lb.setAttribute("aria-hidden", "true");
  lb.innerHTML = `
    <div class="lightbox__bar"><span id="lbCount" class="lightbox__count"></span><div class="drawer__tools">
      ${iconButton("zoom", "Калон кардан", 'id="lbZoom"')}${iconButton("x", "Пӯшидан", "data-close")}</div></div>
    <div class="lightbox__stage" id="lbStage"><img id="lbImg" alt="" decoding="async" onerror="imgFallback(this)"></div>
    ${iconButton("chevLeft", "Расми пешина", 'data-lb="-1"', "icon-btn icon-btn--glass lightbox__nav lightbox__nav--prev")}
    ${iconButton("chevRight", "Расми оянда", 'data-lb="1"', "icon-btn icon-btn--glass lightbox__nav lightbox__nav--next")}`;
  document.body.appendChild(lb);
  const lbStage = $("#lbStage"), lbImg = $("#lbImg");
  let lbIdx = 0;

  function setLb(i) {
    const list = images();
    lbIdx = (i + list.length) % list.length;
    lbStage.classList.remove("is-zoomed");
    lbImg.classList.remove("is-placeholder");
    lbImg.src = list[lbIdx];
    lbImg.alt = p.name;
    $("#lbCount").textContent = list.length > 1 ? (lbIdx + 1) + " / " + list.length : "";
    $$("[data-lb]", lb).forEach(b => { b.hidden = list.length < 2; });
  }
  function openLightbox(i) { setLb(i); Layers.open(lb); }
  function toggleLbZoom() {
    lbStage.classList.toggle("is-zoomed");
    if (lbStage.classList.contains("is-zoomed")) {
      requestAnimationFrame(() => {
        lbStage.scrollLeft = (lbStage.scrollWidth - lbStage.clientWidth) / 2;
        lbStage.scrollTop = (lbStage.scrollHeight - lbStage.clientHeight) / 2;
      });
    }
  }
  lb.addEventListener("click", e => {
    const nav = e.target.closest("[data-lb]");
    if (nav) { setLb(lbIdx + Number(nav.dataset.lb)); return; }
    if (e.target.closest("#lbZoom") || e.target === lbImg) { if (!lbStage.dataset.swiped) toggleLbZoom(); }
  });
  document.addEventListener("keydown", e => {
    if (!lb.classList.contains("is-open")) return;
    if (e.key === "ArrowLeft") setLb(lbIdx - 1);
    if (e.key === "ArrowRight") setLb(lbIdx + 1);
  });
  onSwipe(lbStage, dir => { if (!lbStage.classList.contains("is-zoomed")) setLb(lbIdx + (dir === "left" ? 1 : -1)); });

  /* ---------- Ранг, андоза, миқдор ---------- */
  bindSelection($("#pdpInfo"), p, state, () => {
    state.imgIdx = 0;
    renderThumbs();
    showImage(0);
    history.replaceState(null, "", productUrl(p, state.colorIdx));
  });

  const qtyVal = $("#qtyVal"), minus = $('[data-qty="-1"]'), plus = $('[data-qty="1"]');
  $$("[data-qty]").forEach(b => b.addEventListener("click", () => {
    state.qty = Math.max(1, Math.min(Cart.MAX_QTY, state.qty + Number(b.dataset.qty)));
    qtyVal.textContent = state.qty;
    minus.disabled = state.qty <= 1;
    plus.disabled = state.qty >= Cart.MAX_QTY;
  }));

  /* ---------- Амалҳо ---------- */
  $("#addCart").addEventListener("click", () => addSelectedToCart(p, state, state.qty, root));
  const buy = () => { if (addSelectedToCart(p, state, state.qty, root)) location.href = "checkout.html"; };
  $("#buyNow").addEventListener("click", buy);
  $("#buyNowBar").addEventListener("click", buy);

  $("#shareBtn").addEventListener("click", async () => {
    const data = { title: p.name + " — NAMUNA SHOP", text: p.name, url: location.href };
    try {
      if (navigator.share) { await navigator.share(data); return; }
    } catch (e) { if (e && e.name === "AbortError") return; }
    const ok = await copyText(location.href);
    toast(ok ? "Истинод нусха шуд" : "Истинод нусха нашуд", ok ? "copy" : "info");
  });

  /* Навори харид дар мобилӣ: вақте тугмаҳои асосӣ намоён нестанд, нишон дода мешавад */
  const buybar = $("#buybar");
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(entries => {
      entries.forEach(en => buybar.classList.toggle("is-visible", !en.isIntersecting && en.boundingClientRect.top < 0));
    }, { threshold: 0 }).observe($("#pdpActions"));
  } else buybar.classList.add("is-visible");
})();
