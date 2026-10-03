"use strict";
/* ==========================================================
   NAMUNA SHOP — расмикунонии фармоиш
   Сервер вуҷуд надорад: паёми фармоиш сохта мешавад ва
   муштарӣ онро тавассути Telegram, WhatsApp ё нусха мефиристад.
   ========================================================== */
(function () {
  const root = $("#checkoutRoot");
  if (!root) return;

  const CITIES = ["Душанбе", "Хуҷанд", "Бохтар", "Кӯлоб", "Ҳисор", "Турсунзода", "Данғара", "Истаравшан", "Ваҳдат", "Қурғонтеппа", "Панҷакент", "Хоруғ", "Конибодом", "Исфара"];

  function render() {
    const lines = Cart.detailed();
    if (!lines.length) {
      root.innerHTML = `<div class="empty"><div class="empty__icon">${icon("bag", 44)}</div>
        <p class="empty__title">Сабад холӣ аст.</p><a class="btn btn--gold" href="catalog.html">Ба каталог ${icon("arrowRight", 18)}</a></div>`;
      return;
    }
    const saved = Prefs.get("customer", {});
    root.innerHTML = `
    <div class="checkout">
      <form class="checkout__form" id="orderForm" novalidate>
        ${field("name", "Ному насаб", "text", saved.name, 'autocomplete="name"')}
        <div class="field" data-field="phone">
          <label for="f-phone">Рақами телефон</label>
          <div class="input-prefix"><span>+992</span><input id="f-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel-national" placeholder="90 123 45 67" value="${escapeHtml(saved.phone || "")}" aria-describedby="e-phone"></div>
          <p class="field__error" id="e-phone" role="alert"></p>
        </div>
        <div class="field" data-field="city">
          <label for="f-city">Шаҳр</label>
          <input id="f-city" name="city" list="cityList" autocomplete="address-level2" value="${escapeHtml(saved.city || "")}" aria-describedby="e-city">
          <datalist id="cityList">${CITIES.map(c => `<option value="${c}">`).join("")}</datalist>
          <p class="field__error" id="e-city" role="alert"></p>
        </div>
        ${field("address", "Суроға", "text", saved.address, 'autocomplete="street-address"')}
        <div class="field" data-field="note">
          <label for="f-note">Шарҳи иловагӣ</label>
          <textarea id="f-note" name="note" rows="3"></textarea>
        </div>
        <button type="submit" class="btn btn--gold btn--lg btn--block">Фармоишро фиристодан ${icon("arrowRight", 20)}</button>
      </form>
      <aside class="checkout__summary"><div class="summary-card">
        <h2 class="summary__title">Маҳсулот</h2>
        <div class="summary__lines">${lines.map(l => `
          <div class="sum-line">
            <span class="sum-line__img">${imgHTML(l.image, l.product.name)}</span>
            <div class="sum-line__info"><strong>${escapeHtml(l.product.name)}</strong>
              <small>${escapeHtml(l.color)} · ${escapeHtml(l.size)} · × ${l.qty}</small></div>
            <span class="sum-line__price">${formatPrice(l.lineTotal)}</span>
          </div>`).join("")}</div>
        <div class="cart-total"><span>Ҳамагӣ</span><strong>${formatPrice(Cart.total())}</strong></div>
        <a class="link-arrow" href="cart.html">${icon("arrowLeft", 16)} Сабад</a>
      </div></aside>
    </div>`;
    $("#orderForm").addEventListener("submit", onSubmit);
    $$("#orderForm input, #orderForm textarea").forEach(i => i.addEventListener("input", () => clearError(i.closest(".field"))));
  }

  function field(name, label, type, value, attrs = "") {
    return `<div class="field" data-field="${name}">
      <label for="f-${name}">${label}</label>
      <input id="f-${name}" name="${name}" type="${type}" ${attrs} value="${escapeHtml(value || "")}" aria-describedby="e-${name}">
      <p class="field__error" id="e-${name}" role="alert"></p></div>`;
  }
  function setError(name, msg) {
    const f = $(`[data-field="${name}"]`);
    f.classList.add("has-error");
    $(".field__error", f).textContent = msg;
    const input = $("input, textarea", f);
    if (input) input.setAttribute("aria-invalid", "true");
  }
  function clearError(f) {
    if (!f) return;
    f.classList.remove("has-error");
    const e = $(".field__error", f); if (e) e.textContent = "";
    const i = $("input, textarea", f); if (i) i.removeAttribute("aria-invalid");
  }

  /* Рақами тоҷикистонӣ: 9 рақам (бо +992 ё бе он) */
  function parsePhone(raw) {
    let d = onlyDigits(raw);
    if (d.length === 12 && d.startsWith("992")) d = d.slice(3);
    if (d.length !== 9) return null;
    return `+992 ${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}`;
  }

  function validate(data) {
    let ok = true;
    $$(".field", root).forEach(clearError);
    if (data.name.length < 3 || !/[A-Za-zА-Яа-яЁёӢӣӮӯҚқҒғҲҳҶҷ]{2}/.test(data.name)) { setError("name", "Ному насабро пурра ворид кунед"); ok = false; }
    const phone = parsePhone(data.phoneRaw);
    if (!phone) { setError("phone", "Рақами телефонро дуруст ворид кунед (9 рақам)"); ok = false; } else data.phone = phone;
    if (data.city.length < 2) { setError("city", "Шаҳрро ворид кунед"); ok = false; }
    if (data.address.length < 5) { setError("address", "Суроғаро пурра ворид кунед"); ok = false; }
    if (!ok) {
      const first = $(".has-error input", root);
      if (first) first.focus();
    }
    return ok;
  }

  function pad(n) { return String(n).padStart(2, "0"); }
  function buildMessage(data, lines) {
    const now = new Date();
    const orderNo = "NS-" + String(now.getFullYear()).slice(2) + pad(now.getMonth() + 1) + pad(now.getDate()) + "-" + String(Math.floor(1000 + Math.random() * 9000));
    const date = `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const L = [STORE_CONFIG.shopName.toUpperCase(), "", `ФАРМОИШ № ${orderNo}`, `Сана: ${date}`, "",
      `Ном: ${data.name}`, `Телефон: ${data.phone}`, `Шаҳр: ${data.city}`, `Суроға: ${data.address}`];
    if (data.note) L.push(`Шарҳ: ${data.note}`);
    L.push("", "Маҳсулот:");
    lines.forEach((l, i) => L.push(`${i + 1}) ${l.product.name}`, `Ранг: ${l.color}`, `Андоза: ${l.size}`, `Миқдор: ${l.qty}`, `Нарх: ${formatPrice(l.product.price)}`, ""));
    L.push(`ҲАМАГӢ: ${formatPrice(Cart.total())}`);
    return L.join("\n");
  }

  /* Пайвандҳо: агар танзим нашуда бошад, муштарӣ худаш чат/контактро интихоб мекунад */
  function telegramLink(msg) {
    const u = cleanHandle(STORE_CONFIG.telegramUsername);
    return u ? `https://t.me/${u}?text=${encodeURIComponent(msg)}`
             : `https://t.me/share/url?url=${encodeURIComponent(STORE_CONFIG.shopName.toUpperCase())}&text=${encodeURIComponent(msg)}`;
  }
  function whatsappLink(msg) {
    const n = onlyDigits(STORE_CONFIG.whatsappNumber);
    return `https://wa.me/${n}?text=${encodeURIComponent(msg)}`;
  }

  function showResult(msg) {
    root.innerHTML = `<div class="result">
      <div class="result__head"><span class="result__icon">${icon("check", 26)}</span><h2>Фармоиш омода шуд</h2></div>
      <p class="muted">Фармоишро тавассути яке аз роҳҳои зерин фиристед.</p>
      <pre class="order-pre" id="orderPre" tabindex="0"></pre>
      <div class="result__actions">
        <a class="btn btn--outline" id="sendTg" href="${telegramLink(msg)}" target="_blank" rel="noopener noreferrer">${icon("telegram", 20)} Telegram</a>
        <a class="btn btn--outline" id="sendWa" href="${whatsappLink(msg)}" target="_blank" rel="noopener noreferrer">${icon("whatsapp", 20)} WhatsApp</a>
        <button type="button" class="btn btn--outline" id="copyOrder">${icon("copy", 20)} Нусха кардан</button>
      </div>
      <div class="result__foot">
        <button type="button" class="btn btn--ghost" id="editOrder">${icon("arrowLeft", 18)} Тағйир додан</button>
        <button type="button" class="btn btn--gold" id="doneOrder">${icon("check", 18)} Фиристодам</button>
      </div>
    </div>`;
    $("#orderPre").textContent = msg;
    $("#copyOrder").addEventListener("click", async () => {
      const ok = await copyText(msg);
      toast(ok ? "Фармоиш нусха шуд" : "Нусха нашуд", ok ? "copy" : "info");
    });
    $("#editOrder").addEventListener("click", () => { render(); window.scrollTo({ top: 0 }); });
    $("#doneOrder").addEventListener("click", () => { Cart.clear(); location.href = "index.html"; });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function onSubmit(e) {
    e.preventDefault();
    const f = e.target;
    const data = {
      name: f.elements["name"].value.trim(), phoneRaw: f.elements["phone"].value.trim(), city: f.elements["city"].value.trim(),
      address: f.elements["address"].value.trim(), note: f.elements["note"].value.trim()
    };
    if (!validate(data)) return;
    Prefs.set("customer", { name: data.name, phone: f.elements["phone"].value.trim(), city: data.city, address: data.address });
    const lines = Cart.detailed();
    showResult(buildMessage(data, lines));
    toast("Ба фармоиш омода шуд");
  }

  render();
})();
