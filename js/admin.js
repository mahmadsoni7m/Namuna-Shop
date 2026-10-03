/* NAMUNA SHOP — админ: маҳсулотро бевосита дар GitHub илова/таҳрир/нест мекунад (бе Termux, бе сервер). */
(function () {
  "use strict";
  var $ = function (s) { return document.querySelector(s); };
  var COLORS = { "Сиёҳ": "black", "Сафед": "white", "Сурх": "red", "Кабуд": "blue", "Беж": "beige", "Сабз": "green" };
  var LS = "namuna_admin", PATH = "js/products.js";
  var cfg = {};
  try { cfg = JSON.parse(localStorage.getItem(LS)) || {}; } catch (e) { cfg = {}; }
  if (!cfg.repo && /\.github\.io$/.test(location.hostname)) {
    var rp = location.pathname.split("/")[1];
    if (rp) cfg.repo = location.hostname.split(".")[0] + "/" + rp;
  }
  cfg.branch = cfg.branch || "main";
  $("#repo").value = cfg.repo || ""; $("#branch").value = cfg.branch; $("#token").value = cfg.token || "";
  ["#color", "#e_color"].forEach(function (id) {
    Object.keys(COLORS).forEach(function (c) { var o = document.createElement("option"); o.textContent = c; $(id).appendChild(o); });
  });
  $("#color").value = "Сафед";

  /* ---------- ёрирасонҳо ---------- */
  function say(el, msg, cls) { el.innerHTML = ""; var d = document.createElement("div"); d.className = cls || ""; d.textContent = msg; el.appendChild(d); }
  function readCfg() {
    cfg.repo = $("#repo").value.trim().replace(/^https?:\/\/github\.com\//, "").replace(/\/+$/, "");
    cfg.branch = $("#branch").value.trim() || "main";
    cfg.token = $("#token").value.trim();
  }
  function b64FromBytes(bytes) { var s = "", n = 0x8000; for (var i = 0; i < bytes.length; i += n) s += String.fromCharCode.apply(null, bytes.subarray(i, i + n)); return btoa(s); }
  function textToB64(t) { return b64FromBytes(new TextEncoder().encode(t)); }
  function b64ToText(b) { var s = atob(b.replace(/\s/g, "")), a = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return new TextDecoder().decode(a); }
  function csv(v) { return v.split(",").map(function (s) { return s.trim(); }).filter(Boolean); }
  function pad(id) { return ("000" + id).slice(-3); }
  function needCfg(log) { readCfg(); if (!cfg.repo || !cfg.token) { say(log, "Аввал қисми 1-ро пур кунед.", "er"); return false; } return true; }

  async function gh(method, path, body) {
    var url = "https://api.github.com/repos/" + cfg.repo + "/contents/" + path + (method === "GET" ? "?ref=" + encodeURIComponent(cfg.branch) : "");
    var r = await fetch(url, {
      method: method,
      headers: { Authorization: "Bearer " + cfg.token, Accept: "application/vnd.github+json" },
      body: body ? JSON.stringify(body) : undefined
    });
    var j = {}; try { j = await r.json(); } catch (e) { }
    if (!r.ok) { var er = new Error(j.message || ("HTTP " + r.status)); er.status = r.status; throw er; }
    return j;
  }
  function explain(e) {
    if (e.status === 401) return "Token нодуруст аст.";
    if (e.status === 403) return "Token ҳуқуқи навиштан надорад (Contents: Read and write лозим).";
    if (e.status === 404) return "Репозиторий ё файл ёфт нашуд. Номи репозиторий ва token-ро санҷед.";
    if (e.status === 409 || e.status === 422) return "Ихтилоф дар файл. Аз нав кӯшиш кунед. (" + e.message + ")";
    return e.message || String(e);
  }

  /* ---------- products.js: хондан ва навиштан ---------- */
  async function loadState() {
    var cur = await gh("GET", PATH);
    var src = b64ToText(cur.content);
    var m = /const\s+PRODUCTS\s*=\s*\[/.exec(src);
    var end = src.lastIndexOf("];");
    if (!m || end < 0) throw new Error("products.js вайрон аст (PRODUCTS ёфт нашуд).");
    var start = m.index + m[0].length - 1;
    var arr;
    try { arr = new Function("return " + src.slice(start, end + 1))(); }
    catch (e) { throw new Error("Рӯйхати маҳсулот хато дорад: " + e.message); }
    return { src: src, sha: cur.sha, arr: arr, start: start, end: end };
  }
  function saveState(st, arr, msg) {
    var text = st.src.slice(0, st.start) + JSON.stringify(arr, null, 2) + st.src.slice(st.end + 1);
    return gh("PUT", PATH, { message: msg, content: textToB64(text), branch: cfg.branch, sha: st.sha });
  }
  async function toJpegB64(file) {
    var bmp = await createImageBitmap(file);
    var k = Math.min(1, 1200 / Math.max(bmp.width, bmp.height));
    var c = document.createElement("canvas"); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    var x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.drawImage(bmp, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.85).split(",")[1];
  }
  async function putFile(path, contentB64, msg) {
    var sha;
    try { sha = (await gh("GET", path)).sha; } catch (e) { if (e.status !== 404) throw e; }
    return gh("PUT", path, { message: msg, content: contentB64, branch: cfg.branch, sha: sha });
  }
  async function uploadPhotos(files, id, folder, name, log) {
    var rel = [];
    for (var i = 0; i < files.length; i++) {
      say(log, "Расм " + (i + 1) + " аз " + files.length + " боргирӣ мешавад…");
      var path = "assets/products/product-" + pad(id) + "/" + folder + "/" + (i + 1) + ".jpg";
      await putFile(path, await toJpegB64(files[i]), "Расм: " + name);
      rel.push(path);
    }
    return rel;
  }

  /* ---------- 1. Танзимот ---------- */
  $("#saveSet").onclick = async function () {
    readCfg();
    var log = $("#setLog");
    if (!cfg.repo || !cfg.token) return say(log, "Репозиторий ва token-ро пур кунед.", "er");
    try {
      await gh("GET", PATH);
      localStorage.setItem(LS, JSON.stringify(cfg));
      say(log, "Пайваст шуд ✓", "ok");
      refreshList();
    } catch (e) { say(log, explain(e), "er"); }
  };

  /* ---------- 2. Маҳсулоти нав ---------- */
  $("#photos").onchange = function () {
    var p = $("#prev"); p.innerHTML = "";
    Array.prototype.forEach.call(this.files, function (f) { var i = new Image(); i.src = URL.createObjectURL(f); p.appendChild(i); });
  };
  $("#go").onclick = async function () {
    var btn = this, log = $("#log");
    if (!needCfg(log)) return;
    var name = $("#name").value.trim(), price = parseInt($("#price").value, 10), old = parseInt($("#old").value, 10) || 0;
    var files = $("#photos").files;
    if (!name) return say(log, "Номро нависед.", "er");
    if (!(price > 0)) return say(log, "Нархро нависед.", "er");
    if (!files.length) return say(log, "Ҳадди ақал як расм интихоб кунед.", "er");
    btn.disabled = true;
    try {
      say(log, "Файли маҳсулот хонда мешавад…");
      var st = await loadState();
      var id = Math.max.apply(null, st.arr.map(function (p) { return +p.id || 0; }).concat([0])) + 1;
      var color = $("#color").value;
      var rel = await uploadPhotos(files, id, COLORS[color], name, log);
      var entry = {
        id: id, name: name, category: $("#cat").value, price: price, oldPrice: old,
        description: $("#desc").value.trim(), colors: [{ name: color, images: rel }],
        sizes: csv($("#sizes").value), soldOutSizes: [], rating: 4.8, reviews: 10,
        featured: true, newArrival: true, sale: old > price, hot: false, limited: false
      };
      if (old <= price) delete entry.oldPrice;
      say(log, "Рӯйхати маҳсулот нав мешавад…");
      st.arr.push(entry);
      await saveState(st, st.arr, "Маҳсулот: " + name);
      say(log, "Тайёр ✓ Маҳсулот № " + id + " илова шуд.\nСайт баъд аз 1–2 дақиқа нав мешавад.", "ok");
      $("#name").value = ""; $("#price").value = ""; $("#photos").value = ""; $("#prev").innerHTML = "";
      refreshList();
    } catch (e) { say(log, "Хато: " + explain(e), "er"); }
    btn.disabled = false;
  };

  /* ---------- 3. Рӯйхат ---------- */
  var current = null;
  async function refreshList() {
    var box = $("#list"), log = $("#listLog");
    readCfg();
    if (!cfg.repo || !cfg.token) { box.innerHTML = ""; return say(log, "Аввал қисми 1-ро пур кунед.", "er"); }
    say(log, "Хонда мешавад…");
    try {
      var st = await loadState();
      box.innerHTML = "";
      if (!st.arr.length) return say(log, "Ҳоло маҳсулот нест.");
      log.innerHTML = "";
      st.arr.forEach(function (p) {
        var row = document.createElement("div"); row.className = "it";
        var img = document.createElement("img");
        var first = p.colors && p.colors[0] && p.colors[0].images && p.colors[0].images[0];
        if (first) img.src = first;
        var info = document.createElement("div");
        var b = document.createElement("b"); b.textContent = "№" + p.id + " · " + p.name;
        var s = document.createElement("small"); s.textContent = p.price + " с. · " + p.category;
        info.appendChild(b); info.appendChild(s);
        var e1 = document.createElement("button"); e1.className = "s"; e1.type = "button"; e1.textContent = "Таҳрир";
        e1.onclick = function () { openEdit(p.id); };
        var d1 = document.createElement("button"); d1.className = "d"; d1.type = "button"; d1.textContent = "Нест";
        d1.onclick = function () { removeProduct(p.id, p.name, d1); };
        row.appendChild(img); row.appendChild(info); row.appendChild(e1); row.appendChild(d1);
        box.appendChild(row);
      });
    } catch (e) { say(log, "Хато: " + explain(e), "er"); }
  }
  $("#reload").onclick = refreshList;

  async function removeProduct(id, name, btn) {
    var log = $("#listLog");
    if (!confirm("«" + name + "» нест карда шавад? Баргардонда намешавад.")) return;
    btn.disabled = true;
    try {
      say(log, "Нест карда мешавад…");
      var st = await loadState();
      var p = st.arr.filter(function (x) { return +x.id === +id; })[0];
      var rest = st.arr.filter(function (x) { return +x.id !== +id; });
      await saveState(st, rest, "Нест кардан: " + name);
      if (p && p.colors) {
        for (var c = 0; c < p.colors.length; c++) {
          var imgs = p.colors[c].images || [];
          for (var i = 0; i < imgs.length; i++) {
            try { var f = await gh("GET", imgs[i]); await gh("DELETE", imgs[i], { message: "Нест кардани расм", sha: f.sha, branch: cfg.branch }); } catch (e) { }
          }
        }
      }
      $("#editCard").hidden = true;
      await refreshList();
      say($("#listLog"), "«" + name + "» нест шуд ✓", "ok");
    } catch (e) { say(log, "Хато: " + explain(e), "er"); btn.disabled = false; }
  }

  /* ---------- Таҳрир ---------- */
  async function openEdit(id) {
    var log = $("#editLog");
    $("#editCard").hidden = false; say(log, "Хонда мешавад…");
    try {
      var st = await loadState();
      var p = st.arr.filter(function (x) { return +x.id === +id; })[0];
      if (!p) return say(log, "Маҳсулот ёфт нашуд.", "er");
      current = { id: p.id, name: p.name };
      $("#editTitle").textContent = "Таҳрир: №" + p.id;
      $("#e_name").value = p.name; $("#e_cat").value = p.category; $("#e_price").value = p.price;
      $("#e_old").value = p.oldPrice || 0; $("#e_sizes").value = (p.sizes || []).join(",");
      $("#e_sold").value = (p.soldOutSizes || []).join(","); $("#e_desc").value = p.description || "";
      $("#e_new").checked = !!p.newArrival; $("#e_feat").checked = !!p.featured;
      $("#e_hot").checked = !!p.hot; $("#e_lim").checked = !!p.limited;
      log.innerHTML = "";
      $("#editCard").scrollIntoView({ behavior: "smooth" });
    } catch (e) { say(log, "Хато: " + explain(e), "er"); }
  }
  $("#e_close").onclick = function () { $("#editCard").hidden = true; };
  $("#e_save").onclick = async function () {
    var btn = this, log = $("#editLog");
    if (!current || !needCfg(log)) return;
    var price = parseInt($("#e_price").value, 10), old = parseInt($("#e_old").value, 10) || 0;
    if (!$("#e_name").value.trim() || !(price > 0)) return say(log, "Ном ва нархро дуруст нависед.", "er");
    btn.disabled = true;
    try {
      var st = await loadState();
      var p = st.arr.filter(function (x) { return +x.id === +current.id; })[0];
      if (!p) throw new Error("Маҳсулот дигар вуҷуд надорад.");
      p.name = $("#e_name").value.trim(); p.category = $("#e_cat").value; p.price = price;
      if (old > price) p.oldPrice = old; else delete p.oldPrice;
      p.sale = old > price;
      p.sizes = csv($("#e_sizes").value); p.soldOutSizes = csv($("#e_sold").value);
      p.description = $("#e_desc").value.trim();
      p.newArrival = $("#e_new").checked; p.featured = $("#e_feat").checked;
      p.hot = $("#e_hot").checked; p.limited = $("#e_lim").checked;
      await saveState(st, st.arr, "Таҳрир: " + p.name);
      say(log, "Захира шуд ✓ Сайт баъд аз 1–2 дақиқа нав мешавад.", "ok");
      refreshList();
    } catch (e) { say(log, "Хато: " + explain(e), "er"); }
    btn.disabled = false;
  };
  $("#e_addcolor").onclick = async function () {
    var btn = this, log = $("#editLog");
    if (!current || !needCfg(log)) return;
    var files = $("#e_photos").files, color = $("#e_color").value;
    if (!files.length) return say(log, "Расм интихоб кунед.", "er");
    btn.disabled = true;
    try {
      var st = await loadState();
      var p = st.arr.filter(function (x) { return +x.id === +current.id; })[0];
      if (!p) throw new Error("Маҳсулот дигар вуҷуд надорад.");
      if ((p.colors || []).some(function (c) { return c.name === color; })) throw new Error("Ранги «" + color + "» аллакай ҳаст.");
      var rel = await uploadPhotos(files, p.id, COLORS[color], p.name, log);
      p.colors = (p.colors || []).concat([{ name: color, images: rel }]);
      await saveState(st, st.arr, "Ранги нав: " + p.name);
      say(log, "Ранги «" + color + "» илова шуд ✓", "ok");
      $("#e_photos").value = "";
      refreshList();
    } catch (e) { say(log, "Хато: " + explain(e), "er"); }
    btn.disabled = false;
  };

  if (cfg.repo && cfg.token) refreshList();
})();
