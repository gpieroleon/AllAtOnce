/* ═══════════════════════════════════════════════════════════
   ALL AT ONCE — Panel de administración completo (admin.html)
   Sección 3 de la especificación:
     · Roles y permisos (3.5): superadmin / editor / soporte
     · Dashboard con métricas (3.2)
     · Productos: lista con búsqueda, filtros y acciones masivas,
       alta y edición con formulario completo (3.3)
     · Categorías (CRUD) · Inventario (ajustes de stock)
     · Pedidos: filtros, detalle, cambio de estado con notificación,
       tracking e impresión de factura (3.4)
     · Clientes: búsqueda, detalle con historial y notas internas
     · Cupones (CRUD) · Reseñas (moderación) · Reportes (CSV)
     · Envíos / Pagos / Configuración / Usuarios (superadmin)
   ═══════════════════════════════════════════════════════════ */

"use strict";

(function () {
  const $ = (sel) => document.querySelector(sel);
  const root = $("#adminRoot");
  const ESTADOS = ["Pendiente de pago", "Pagado", "En preparación", "Enviado", "Entregado", "Cancelado", "Reembolsado"];
  const TABS = [
    ["dashboard", "Dashboard"], ["pedidos", "Pedidos"], ["productos", "Productos"],
    ["categorias", "Categorías"], ["inventario", "Inventario"], ["clientes", "Clientes"],
    ["cupones", "Cupones"], ["resenas", "Reseñas"], ["reportes", "Reportes"],
    ["envios", "Envíos"], ["pagos", "Pagos"], ["configuracion", "Configuración"],
    ["usuarios", "Usuarios"],
  ];
  /* Navegación agrupada del panel (filtrada por rol) */
  const GROUPS = [
    ["Principal", [["dashboard", "Dashboard"], ["reportes", "Reportes"]]],
    ["Ventas", [["pedidos", "Pedidos"], ["clientes", "Clientes"], ["cupones", "Cupones"]]],
    ["Catálogo", [["productos", "Productos"], ["categorias", "Categorías"], ["inventario", "Inventario"], ["resenas", "Reseñas"]]],
    ["Configuración", [["envios", "Envíos"], ["pagos", "Pagos"], ["configuracion", "Configuración"], ["usuarios", "Usuarios"]]],
  ];
  const TAB_LABEL = Object.fromEntries(TABS);

  const view = {
    tab: "dashboard", productEdit: null, orderId: null, clientEmail: null,
    resenaProduct: null, bulk: new Set(),
    prodQ: "", prodCat: "all",
    orderQ: "", orderEstado: "all", orderDesde: "", orderHasta: "",
    clientQ: "",
  };

  const statusClass = (e) => ({
    "Pendiente de pago": "status--warn", Pagado: "status--info",
    "En preparación": "status--info", Enviado: "status--ok", Entregado: "status--ok",
    Cancelado: "status--bad", Reembolsado: "status--bad",
  }[e] || "");
  const fmtDate = (iso) => new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
  const fmtDateTime = (iso) => new Date(iso).toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

  /* ─────────── Login admin (separado y protegido) ─────────── */
  function renderLogin() {
    root.innerHTML = `
      <div class="auth-page adm-login">
        <main class="auth">
          <a href="index.html" class="logo auth__logo">
            <span class="logo__mark">AAO</span>
            <span class="logo__text">All<b>At</b>Once</span>
          </a>
          <div class="auth__card">
            <h1 class="auth__title">Panel de administración</h1>
            <div class="auth__alert" id="admAlert" hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>
              <div><strong>Acceso denegado</strong><p id="admMsg"></p></div>
            </div>
            <form id="admForm" novalidate>
              <label class="auth__label" for="admEmail">Email</label>
              <input class="auth__input" type="email" id="admEmail" autocomplete="username">
              <label class="auth__label" for="admPass">Contraseña</label>
              <input class="auth__input" type="password" id="admPass" autocomplete="current-password">
              <button class="auth__btn" type="submit">Entrar al panel</button>
            </form>
          </div>
          <footer class="auth__foot"><p>© 2026 All At Once · Acceso restringido al equipo</p></footer>
        </main>
      </div>`;

    const tryLogin = () => {
      const email = $("#admEmail").value.trim().toLowerCase();
      const user = AAO_AUTH.find(email);
      if (!user || !AAO_AUTH.ADMIN_ROLES.includes(user.role) || user.pass !== btoa($("#admPass").value)) {
        $("#admMsg").textContent = "Credenciales de administrador no válidas.";
        $("#admAlert").hidden = false;
        return;
      }
      AAO_AUTH.login(email, $("#admPass").value);
      location.hash = "#dashboard";
      renderPanel();
    };
    $("#admForm").addEventListener("submit", (e) => { e.preventDefault(); tryLogin(); });
  }

  /* ─────────── Enrutado por hash ─────────── */
  function parseHash() {
    const h = location.hash.replace(/^#/, "");
    const [head, arg] = h.split("/");
    view.productEdit = null; view.orderId = null; view.clientEmail = null;
    if (head === "producto-nuevo") { view.tab = "productos"; view.productEdit = "new"; }
    else if (head === "producto-editar") { view.tab = "productos"; view.productEdit = Number(arg); }
    else if (head === "pedido") { view.tab = "pedidos"; view.orderId = arg; }
    else if (head === "cliente") { view.tab = "clientes"; view.clientEmail = decodeURIComponent(arg); }
    else if (TABS.some(([id]) => id === head)) view.tab = head;
    const allowed = TABS.filter(([id]) => AAO_AUTH.can(id)).map(([id]) => id);
    if (!allowed.includes(view.tab)) view.tab = allowed[0];
  }

  /* ─────────── Persistencia del catálogo (overrides + altas) ─────────── */
  const getOverrides = () => JSON.parse(localStorage.getItem("aao_product_overrides") || "{}");
  const setOverrides = (o) => localStorage.setItem("aao_product_overrides", JSON.stringify(o));

  function hotApply(id, patch) {
    const p = AAO.ALL_PRODUCTS.find((x) => x.id === Number(id));
    if (p) Object.assign(p, patch);
    const store = AAO.PRODUCTS;
    const idx = store.findIndex((x) => x.id === Number(id));
    if (patch.estado === "borrador" && idx >= 0) store.splice(idx, 1);
    if ((patch.estado === "publicado" || !patch.estado) && idx < 0 && p && p.estado !== "borrador" && !store.some((x) => x.id === p.id)) store.push(p);
  }

  function patchProduct(id, patch) {
    const o = getOverrides();
    o[id] = { ...(o[id] || {}), ...patch };
    setOverrides(o);
    hotApply(id, patch);
  }

  function createProduct(data) {
    const customs = JSON.parse(localStorage.getItem("aao_products_custom") || "[]");
    customs.push(data);
    localStorage.setItem("aao_products_custom", JSON.stringify(customs));
    AAO.ALL_PRODUCTS.push(data);
    if (data.estado !== "borrador") AAO.PRODUCTS.push(data);
  }

  function deleteProducts(ids) {
    const customs = JSON.parse(localStorage.getItem("aao_products_custom") || "[]");
    const o = getOverrides();
    ids.forEach((id) => {
      if (customs.some((p) => p.id === id)) {
        localStorage.setItem("aao_products_custom", JSON.stringify(customs.filter((p) => p.id !== id)));
        [AAO.ALL_PRODUCTS, AAO.PRODUCTS].forEach((arr) => {
          const i = arr.findIndex((x) => x.id === id);
          if (i >= 0) arr.splice(i, 1);
        });
      } else {
        o[id] = { ...(o[id] || {}), estado: "borrador" };
        hotApply(id, { estado: "borrador" });
      }
    });
    setOverrides(o);
  }

  const slugify = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "producto";

  /* Filas dinámicas del formulario de producto (3.3) */
  const variantRowHTML = (vr = {}) => `
    <div class="vrow">
      <input class="v-talla" placeholder="Talla (S)" value="${esc(vr.talla || "")}">
      <input class="v-color" placeholder="Color (Negro)" value="${esc(vr.color || "")}">
      <input class="v-stock" type="number" min="0" placeholder="Stock" value="${vr.stock != null ? vr.stock : ""}">
      <button type="button" class="v-del" aria-label="Eliminar variante">✕</button>
    </div>`;
  const imageRowHTML = (src = "") => `
    <div class="irow">
      <span class="irow__idx">1</span>
      ${src ? `<img class="irow__thumb" src="${esc(src)}" alt="" onerror="this.remove()">` : '<span class="irow__thumb"></span>'}
      <input class="i-url" placeholder="https://imagen…" value="${esc(src)}">
      <button type="button" class="i-up" aria-label="Subir">↑</button>
      <button type="button" class="i-down" aria-label="Bajar">↓</button>
      <button type="button" class="i-del" aria-label="Eliminar imagen">✕</button>
    </div>`;

  function bindFormRows() {
    const reindex = () => {
      document.querySelectorAll("#fpImages .irow").forEach((row, i) => {
        row.querySelector(".irow__idx").textContent = i + 1;
        row.querySelector(".irow__idx").style.cssText = i === 0
          ? "background:var(--accent-soft);color:var(--accent-dark)"
          : "";
      });
    };
    $("#fpAddVariant").addEventListener("click", () => {
      $("#fpVariants").insertAdjacentHTML("beforeend", variantRowHTML({}));
    });
    $("#fpVariants").addEventListener("click", (e) => {
      const del = e.target.closest(".v-del");
      if (!del) return;
      const rows = document.querySelectorAll("#fpVariants .vrow");
      if (rows.length > 1) del.closest(".vrow").remove();
    });
    $("#fpAddImage").addEventListener("click", () => {
      $("#fpImages").insertAdjacentHTML("beforeend", imageRowHTML(""));
      reindex();
    });
    $("#fpImages").addEventListener("click", (e) => {
      const row = e.target.closest(".irow");
      if (!row) return;
      if (e.target.closest(".i-del")) {
        const rows = document.querySelectorAll("#fpImages .irow");
        if (rows.length > 1) row.remove();
      } else if (e.target.closest(".i-up") && row.previousElementSibling) {
        row.parentNode.insertBefore(row, row.previousElementSibling);
      } else if (e.target.closest(".i-down") && row.nextElementSibling) {
        row.parentNode.insertBefore(row.nextElementSibling, row);
      } else return;
      reindex();
    });
    $("#fpImages").addEventListener("input", reindex);
    reindex();
  }

  function readFormRows() {
    const variantes = [...document.querySelectorAll("#fpVariants .vrow")].map((row) => ({
      talla: row.querySelector(".v-talla").value.trim(),
      color: row.querySelector(".v-color").value.trim(),
      stock: Math.max(0, Number(row.querySelector(".v-stock").value) || 0),
    })).filter((vr) => vr.talla || vr.color);
    const imagenes = [...document.querySelectorAll("#fpImages .i-url")].map((i) => i.value.trim()).filter(Boolean);
    const cats = [...document.querySelectorAll('#fpCats input[type="checkbox"]:checked')].map((cb) => cb.value);
    return { variantes, imagenes, cats };
  }

  /* ─────────── Factura (3.4) ─────────── */
  function invoiceHTML(order) {
    const ivaImporte = order.total - order.total / (1 + AAO.IVA);
    return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Factura ${order.id}</title>
      <style>
        body{font-family:Helvetica,Arial,sans-serif;color:#171310;padding:40px;max-width:720px;margin:auto}
        h1{font-size:22px;margin:0} .muted{color:#6E655C;font-size:12px}
        table{width:100%;border-collapse:collapse;margin:22px 0;font-size:13px}
        th{text-align:left;border-bottom:2px solid #171310;padding:8px 6px;font-size:11px;text-transform:uppercase}
        td{border-bottom:1px solid #ECE3D8;padding:8px 6px}
        .tot{margin-left:auto;width:260px;font-size:13px}
        .tot div{display:flex;justify-content:space-between;padding:4px 0}
        .grand{border-top:2px solid #171310;font-weight:700;font-size:15px;margin-top:6px;padding-top:8px}
        .head{display:flex;justify-content:space-between;align-items:flex-start}
        .badge{display:inline-block;background:#171310;color:#fff;border-radius:99px;padding:5px 14px;font-weight:700;font-size:13px}
      </style></head><body>
      <div class="head">
        <div><h1>${esc(AAO.SETTINGS.tienda)}</h1><p class="muted">Factura simplificada · ${fmtDate(order.fecha)}</p></div>
        <span class="badge">${order.id}</span>
      </div>
      <p style="margin-top:18px"><strong>Cliente:</strong> ${esc(order.nombreCliente)} · ${esc(order.cliente)}<br>
      <strong>Envío a:</strong> ${esc(order.direccion.direccion)}, ${esc(order.direccion.cp)} ${esc(order.direccion.ciudad)} (${esc(order.direccion.provincia)}), ${esc(order.direccion.pais)}<br>
      <strong>Pago:</strong> ${esc(order.pago)} · <strong>Seguimiento:</strong> ${esc(order.tracking)} · <strong>Estado:</strong> ${esc(order.estado)}</p>
      <table><thead><tr><th>Producto</th><th>Cant.</th><th>Precio</th><th>Importe</th></tr></thead>
      <tbody>${order.items.map((it) => `<tr><td>${esc(it.nombre)}</td><td>${it.qty}</td><td>${AAO.fmt.format(it.precio)}</td><td>${AAO.fmt.format(it.precio * it.qty)}</td></tr>`).join("")}</tbody></table>
      <div class="tot">
        <div><span>Subtotal</span><span>${AAO.fmt.format(order.subtotal)}</span></div>
        ${order.descuento ? `<div><span>Descuento (${esc(order.cupon || "")})</span><span>−${AAO.fmt.format(order.descuento)}</span></div>` : ""}
        <div><span>Envío</span><span>${order.envio === 0 ? "Gratis" : AAO.fmt.format(order.envio)}</span></div>
        <div><span>IVA incluido (${AAO.SETTINGS.iva}%)</span><span>${AAO.fmt.format(ivaImporte)}</span></div>
        <div class="grand"><span>Total</span><span>${AAO.fmt.format(order.total)}</span></div>
      </div>
      <p class="muted" style="margin-top:28px">${esc(AAO.SETTINGS.tienda)} · Gracias por tu compra · Documento generado electrónicamente</p>
      </body></html>`;
  }

  function printInvoice(order) {
    try {
      const w = window.open("", "_blank", "width=820,height=640");
      if (!w) { AAO.aaoToast("Permite las ventanas emergentes para imprimir"); return; }
      w.document.write(invoiceHTML(order));
      w.document.close();
      w.focus();
      setTimeout(() => w.print(), 250);
    } catch (e) {
      AAO.aaoToast("No se pudo abrir la factura");
    }
  }

  /* ─────────── Métricas ─────────── */
  function metrics() {
    const orders = AAO_AUTH.getOrders();
    const valid = orders.filter((o) => !["Cancelado", "Reembolsado"].includes(o.estado));
    const sales = valid.reduce((s, o) => s + o.total, 0);
    const now = new Date();
    const day = now.toDateString();
    const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
    const ventasHoy = valid.filter((o) => new Date(o.fecha).toDateString() === day).reduce((s, o) => s + o.total, 0);
    const ventasSemana = valid.filter((o) => new Date(o.fecha) >= weekAgo).reduce((s, o) => s + o.total, 0);
    const ventasMes = valid.filter((o) => { const d = new Date(o.fecha); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).reduce((s, o) => s + o.total, 0);
    const pending = orders.filter((o) => ["Pendiente de pago", "Pagado", "En preparación"].includes(o.estado)).length;
    const lowStock = AAO.ALL_PRODUCTS.filter((p) => p.stock < 60);
    const newClients = Object.values(AAO_AUTH.users()).filter((u) => (u.reg || "") >= weekAgo.toISOString()).length;
    const unitsByProduct = {};
    valid.forEach((o) => o.items.forEach((it) => { unitsByProduct[it.id] = (unitsByProduct[it.id] || 0) + it.qty; }));
    const top = Object.entries(unitsByProduct).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, n]) => ({ p: AAO.byId(id), n })).filter((x) => x.p);
    const last7 = [...Array(7)].map((_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      const total = valid.filter((o) => new Date(o.fecha).toDateString() === d.toDateString()).reduce((s, o) => s + o.total, 0);
      return { label: d.toLocaleDateString("es-ES", { weekday: "short" }), total };
    });
    return { orders, valid, sales, ventasHoy, ventasSemana, ventasMes, pending, lowStock, newClients, top, last7, maxDay: Math.max(...last7.map((d) => d.total), 1) };
  }

  /* ─────────── Panel: shell (diseño exclusivo de administración) ─────────── */
  function renderPanel() {
    parseHash();
    const role = AAO_AUTH.role();
    const s = AAO_AUTH.session();
    const notifs = AAO_AUTH.getNotifications();
    const groups = GROUPS
      .map(([title, items]) => [title, items.filter(([id]) => AAO_AUTH.can(id))])
      .filter(([, items]) => items.length > 0);

    root.innerHTML = `
      <div class="adm">
        <aside class="adm__side" id="admSide">
          <a class="adm__logo" href="#dashboard">
            <span class="logo__mark">AAO</span>
            <span class="adm__logo-name">${esc(AAO.SETTINGS.tienda)}<small>Panel admin</small></span>
          </a>
          <nav class="adm__nav" aria-label="Secciones del panel">
            ${groups.map(([title, items]) => `
              <div class="adm__navgroup">
                <p class="adm__navtitle">${title}</p>
                ${items.map(([id, label]) => `<button data-tab="${id}" class="${view.tab === id ? "is-active" : ""}">${label}</button>`).join("")}
              </div>`).join("")}
          </nav>
          <div class="adm__sidefoot">
            <a href="index.html">${'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-6 9 6v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/></svg>'} Ver tienda</a>
            <button id="admLogout">${'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>'} Cerrar sesión</button>
          </div>
        </aside>
        <div class="adm__main">
          <header class="adm__top">
            <div style="display:flex;align-items:center;gap:12px">
              <button class="adm__burger" id="admBurger" aria-label="Menú">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
              </button>
              <div>
                <h1>${TAB_LABEL[view.tab] || "Panel"}</h1>
                <p>${role === "superadmin" ? "Acceso total · catálogo, ventas, equipo y configuración" : "Operativa · catálogo, inventario, pedidos y clientes"}</p>
              </div>
            </div>
            <div class="adm__topright">
              <div style="position:relative">
                <button class="adm__bell" id="admBell" aria-label="Notificaciones">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M10.3 21a2 2 0 0 0 3.4 0"/></svg>
                  ${notifs.length ? `<span class="adm__bellcount">${notifs.length}</span>` : ""}
                </button>
                <div class="adm__belldrop" id="admBellDrop" hidden>
                  <h4>Notificaciones enviadas (email simulado)</h4>
                  ${notifs.slice(0, 6).map((n) => `
                    <div class="adm__belldrop-item">${esc(n.mensaje)}<br><small>${fmtDateTime(n.fecha)} → ${esc(n.to)}</small></div>`).join("") || '<div class="adm__belldrop-item">Sin notificaciones todavía.</div>'}
                </div>
              </div>
              <div class="adm__user">
                <span class="adm__avatar">${esc((s.name || "A").charAt(0).toUpperCase())}</span>
                <div class="adm__userinfo">
                  <strong>${esc(s.name)}</strong>
                  <span class="adm__rolebadge">${role}</span>
                </div>
              </div>
            </div>
          </header>
          <main class="adm__content" id="adminContent"></main>
        </div>
      </div>`;

    renderTab();

    document.querySelectorAll("[data-tab]").forEach((b) =>
      b.addEventListener("click", () => { location.hash = "#" + b.dataset.tab; $("#admSide").classList.remove("is-open"); })
    );
    $("#admLogout").addEventListener("click", () => {
      AAO_AUTH.logout();
      renderLogin();
    });
    $("#admBurger").addEventListener("click", () => $("#admSide").classList.toggle("is-open"));
    $("#admBell").addEventListener("click", (e) => {
      e.stopPropagation();
      $("#admBellDrop").hidden = !$("#admBellDrop").hidden;
    });
    document.addEventListener("click", (e) => {
      const drop = $("#admBellDrop");
      if (drop && !drop.hidden && !e.target.closest(".adm__bell") && !e.target.closest(".adm__belldrop")) drop.hidden = true;
    });
  }

  /* ─────────── Secciones ─────────── */
  function renderTab() {
    const c = $("#adminContent");
    const m = metrics();
    const go = (hash) => { location.hash = hash; };

    /* ═══ DASHBOARD (3.2) ═══ */
    if (view.tab === "dashboard") {
      const last14 = [...Array(14)].map((_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (13 - i));
        const total = m.valid.filter((o) => new Date(o.fecha).toDateString() === d.toDateString()).reduce((s, o) => s + o.total, 0);
        return { label: d.toLocaleDateString("es-ES", { day: "numeric", month: "short" }), total };
      });
      const max14 = Math.max(...last14.map((d) => d.total), 1);
      const W = 620, H = 190, PAD = 14;
      const pts = last14.map((d, i) => {
        const x = PAD + (i / (last14.length - 1)) * (W - PAD * 2);
        const y = H - 34 - (d.total / max14) * (H - 58);
        return [x, y];
      });
      const linePath = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
      const areaPath = `${linePath} L${pts[pts.length - 1][0]},${H - 30} L${pts[0][0]},${H - 30} Z`;
      c.innerHTML = `
        <div class="kpis">
          <div class="kpi"><span class="kpi__icon">${AAO.icon("cart")}</span><div><b>${AAO.fmt.format(m.ventasHoy)}</b><span>Ventas de hoy</span></div></div>
          <div class="kpi"><span class="kpi__icon kpi__icon--blue">${'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/></svg>'}</span><div><b>${AAO.fmt.format(m.ventasSemana)}</b><span>Ventas de la semana</span></div></div>
          <div class="kpi"><span class="kpi__icon kpi__icon--gold">${'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 9h18"/></svg>'}</span><div><b>${AAO.fmt.format(m.ventasMes)}</b><span>Ventas del mes</span></div></div>
          <div class="kpi"><span class="kpi__icon kpi__icon--green">${'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>'}</span><div><b>${m.valid.length ? AAO.fmt.format(m.sales / m.valid.length) : AAO.fmt.format(0)}</b><span>Ticket promedio</span></div></div>
        </div>
        <div class="admgrid">
          <div class="acard">
            <h2>Tendencia de ventas <small>últimos 14 días · ${AAO.fmt.format(last14.reduce((s, d) => s + d.total, 0))}</small></h2>
            <div class="trend">
              <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico de tendencia de ventas">
                <defs>
                  <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stop-color="#FF4D24" stop-opacity=".25"/>
                    <stop offset="1" stop-color="#FF4D24" stop-opacity="0"/>
                  </linearGradient>
                  <linearGradient id="trendLine" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stop-color="#FF4D24"/><stop offset="1" stop-color="#FF8A00"/>
                  </linearGradient>
                </defs>
                ${[0.25, 0.5, 0.75].map((f) => `<line x1="${PAD}" x2="${W - PAD}" y1="${(H - 34) * f + 6}" y2="${(H - 34) * f + 6}" stroke="#EDE8E0" stroke-width="1"/>`).join("")}
                <path d="${areaPath}" fill="url(#trendFill)"/>
                <path d="${linePath}" fill="none" stroke="url(#trendLine)" stroke-width="3" stroke-linecap="round"/>
                ${pts.map((p, i) => last14[i].total ? `<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="#fff" stroke="#FF4D24" stroke-width="2.5"><title>${last14[i].label}: ${AAO.fmt.format(last14[i].total)}</title></circle>` : "").join("")}
              </svg>
              <div class="trend__labels"><span>${last14[0].label}</span><span>${last14[7].label}</span><span>${last14[13].label}</span></div>
            </div>
          </div>
          <div class="acard">
            <h2>Pedidos por procesar <small>${m.pending} activos</small></h2>
            ${m.orders.filter((o) => ["Pendiente de pago", "Pagado", "En preparación"].includes(o.estado)).slice(0, 5).map((o) => `
              <div class="review-line">
                <span><a class="rowlink" href="#pedido/${o.id}">${o.id}</a><br><small style="color:var(--ink-soft)">${esc(o.nombreCliente)} · ${fmtDate(o.fecha)}</small></span>
                <span><span class="status ${statusClass(o.estado)}">${o.estado}</span><br><strong class="num" style="float:right;margin-top:4px">${AAO.fmt.format(o.total)}</strong></span>
              </div>`).join("") || '<p style="font-size:.86rem;color:var(--ink-soft)">Todo procesado. ¡Buen trabajo!</p>'}
            <h2 style="margin-top:20px">Clientes nuevos <small>últimos 7 días</small></h2>
            <div class="kpi" style="border:none;padding:6px 0"><span class="kpi__icon kpi__icon--green">${'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.5-6.5 8-6.5s8 2.5 8 6.5"/></svg>'}</span><div><b>${m.newClients}</b><span>altas nuevas esta semana</span></div></div>
          </div>
        </div>
        <div class="admgrid-3">
          <div class="acard">
            <h2>Stock bajo <small>&lt; 60% disponible</small></h2>
            ${m.lowStock.slice(0, 5).map((p) => `
              <div class="hbar">
                <span class="hbar__label" title="${esc(p.name)}">${esc(p.name)}</span>
                <div class="hbar__track"><div class="hbar__fill" style="width:${p.stock}%"></div></div>
                <b>${p.stock}%</b>
              </div>`).join("") || '<p style="font-size:.86rem;color:var(--ink-soft)">Stock saludable.</p>'}
          </div>
          <div class="acard">
            <h2>Productos más vendidos</h2>
            ${m.top.map(({ p, n }) => `
              <div class="review-line"><span><strong>${n} uds</strong> · ${esc(p.name)}</span><span class="num">${AAO.fmt.format(n * p.price)}</span></div>`).join("") || '<p style="font-size:.86rem;color:var(--ink-soft)">Sin ventas registradas.</p>'}
          </div>
          <div class="acard">
            <h2>Ingresos totales</h2>
            <div class="kpi" style="border:none;padding:6px 0"><span class="kpi__icon">${'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v10M15.5 9.5c-.7-1-2-1.5-3.5-1.5-1.8 0-3.2.9-3.2 2.2 0 2.9 7 1.4 7 4.2 0 1.3-1.4 2.2-3.3 2.2-1.5 0-2.8-.5-3.5-1.5"/></svg>'}</span><div><b>${AAO.fmt.format(m.sales)}</b><span>${m.valid.length} pedidos válidos</span></div></div>
            <div class="kpi" style="border:none;padding:6px 0"><span class="kpi__icon kpi__icon--blue">${AAO.icon("truck")}</span><div><b>${AAO.fmt.format(m.valid.length ? m.sales / m.valid.length : 0)}</b><span>ticket promedio</span></div></div>
          </div>
        </div>`;
    }

    /* ═══ PEDIDOS: lista con filtros + detalle (3.4) ═══ */
    if (view.tab === "pedidos") {
      if (view.orderId) return renderOrderDetail(c, view.orderId);
      let orders = m.orders;
      if (view.orderEstado !== "all") orders = orders.filter((o) => o.estado === view.orderEstado);
      if (view.orderDesde) orders = orders.filter((o) => o.fecha >= new Date(view.orderDesde).toISOString());
      if (view.orderHasta) orders = orders.filter((o) => o.fecha <= new Date(view.orderHasta + "T23:59:59").toISOString());
      if (view.orderQ) {
        const q = view.orderQ.toLowerCase();
        orders = orders.filter((o) => o.id.toLowerCase().includes(q) || o.cliente.toLowerCase().includes(q) || o.nombreCliente.toLowerCase().includes(q));
      }
      c.innerHTML = `
        <div class="box">
          <div class="admin-toolbar">
            <input type="search" id="oQ" placeholder="Buscar por nº o cliente" value="${esc(view.orderQ)}">
            <select id="oEstado"><option value="all">Todos los estados</option>
              ${ESTADOS.map((e) => `<option ${view.orderEstado === e ? "selected" : ""}>${e}</option>`).join("")}
            </select>
            <input type="date" id="oDesde" value="${view.orderDesde}" title="Desde">
            <input type="date" id="oHasta" value="${view.orderHasta}" title="Hasta">
            <span class="spacer"></span>
            <span class="result-count">${orders.length} pedido${orders.length !== 1 ? "s" : ""}</span>
          </div>
          ${orders.length ? `
          <div class="admin-table-wrap"><table class="ptable admin-table">
            <thead><tr><th>Nº</th><th>Fecha</th><th>Cliente</th><th>Art.</th><th>Total</th><th>Estado</th></tr></thead>
            <tbody>${orders.map((o) => `
              <tr>
                <td><a href="#pedido/${o.id}" class="rowlink">${o.id}</a></td>
                <td class="num">${fmtDate(o.fecha)}</td>
                <td>${esc(o.nombreCliente)}<br><small style="color:var(--ink-soft)">${esc(o.cliente)}</small></td>
                <td class="num">${o.items.reduce((s, i) => s + i.qty, 0)}</td>
                <td class="num"><strong>${AAO.fmt.format(o.total)}</strong></td>
                <td><span class="status ${statusClass(o.estado)}">${o.estado}</span></td>
              </tr>`).join("")}</tbody>
          </table></div>` : '<p style="font-size:.86rem;color:var(--ink-soft)">Ningún pedido coincide con los filtros.</p>'}
        </div>`;
      const rerender = () => renderTab();
      $("#oQ").addEventListener("input", (e) => { view.orderQ = e.target.value; rerender(); });
      $("#oEstado").addEventListener("change", (e) => { view.orderEstado = e.target.value; rerender(); });
      $("#oDesde").addEventListener("change", (e) => { view.orderDesde = e.target.value; rerender(); });
      $("#oHasta").addEventListener("change", (e) => { view.orderHasta = e.target.value; rerender(); });
    }

    /* ═══ PRODUCTOS: lista con búsqueda, filtros y acciones masivas ═══ */
    if (view.tab === "productos") {
      if (view.productEdit) return renderProductForm(c, view.productEdit);

      let list = AAO.ALL_PRODUCTS;
      if (view.prodCat !== "all") list = list.filter((p) => p.cat === view.prodCat);
      if (view.prodQ) list = list.filter((p) => p.name.toLowerCase().includes(view.prodQ.toLowerCase()));
      const customs = JSON.parse(localStorage.getItem("aao_products_custom") || "[]");

      c.innerHTML = `
        <div class="box">
          <div class="admin-toolbar">
            <input type="search" id="pQ" placeholder="Buscar producto" value="${esc(view.prodQ)}">
            <select id="pCat"><option value="all">Todas las categorías</option>
              ${AAO.CATEGORIES.map((cat) => `<option value="${cat.name}" ${view.prodCat === cat.name ? "selected" : ""}>${cat.label}</option>`).join("")}
            </select>
            <span class="spacer"></span>
            <a class="btn btn--primary btn--sm" href="#producto-nuevo">+ Nuevo producto</a>
          </div>
          <div class="bulk-bar ${view.bulk.size ? "is-show" : ""}" id="bulkBar">
            <span>${view.bulk.size} seleccionado${view.bulk.size > 1 ? "s" : ""}</span>
            <button data-bulk="publicado">Publicar</button>
            <button data-bulk="borrador">Enviar a borrador</button>
            <button data-bulk="deal-on">Activar en ofertas</button>
            <button data-bulk="deal-off">Quitar de ofertas</button>
            <button data-bulk="delete" style="background:#B91C1C">Eliminar</button>
            <button data-bulk="clear">✕</button>
          </div>
          <div class="admin-table-wrap"><table class="ptable admin-table">
            <thead><tr><th><input type="checkbox" id="selAll"></th><th></th><th>Producto</th><th>Categoría</th><th>Precio</th><th>Oferta</th><th>Stock</th><th>Estado</th><th></th></tr></thead>
            <tbody>${list.map((p) => `
              <tr>
                <td><input type="checkbox" data-sel="${p.id}" ${view.bulk.has(p.id) ? "checked" : ""}></td>
                <td><span class="ptable__img" style="background:linear-gradient(140deg, ${p.g[0]}, ${p.g[1]})">${AAO.icon(p.icon)}<img src="${p.img}" alt="" onerror="this.remove()"></span></td>
                <td><a href="#producto-editar/${p.id}" class="rowlink">${esc(p.name)}</a><br><small style="color:var(--ink-soft)">${p.sku ? "SKU " + esc(p.sku) : (customs.some((x) => x.id === p.id) ? "producto propio" : "catálogo base")}</small></td>
                <td>${esc(AAO.CAT_LABELS[p.cat] || p.cat)}</td>
                <td class="num">${AAO.fmt.format(p.price)}</td>
                <td class="num">${p.badge === "flash" || p.deal ? `-${AAO.discount(p)}%` : "—"}</td>
                <td><span class="status ${p.stock > 65 ? "status--bad" : p.stock > 45 ? "status--warn" : "status--ok"}">${p.stock < 40 ? "En stock" : p.stock + "%"}</span></td>
                <td>${p.estado === "borrador" ? '<span class="status status--warn">Borrador</span>' : p.estado === "agotado" ? '<span class="status status--bad">Agotado</span>' : '<span class="status status--ok">Publicado</span>'}</td>
                <td><a href="#producto-editar/${p.id}" class="link-btn">Editar</a></td>
              </tr>`).join("")}</tbody>
          </table></div>
        </div>`;

      $("#pQ").addEventListener("input", (e) => { view.prodQ = e.target.value; renderTab(); });
      $("#pCat").addEventListener("change", (e) => { view.prodCat = e.target.value; renderTab(); });
      $("#selAll").addEventListener("change", (e) => {
        list.forEach((p) => (e.target.checked ? view.bulk.add(p.id) : view.bulk.delete(p.id)));
        renderTab();
      });
      document.querySelectorAll("[data-sel]").forEach((cb) =>
        cb.addEventListener("change", () => {
          const id = Number(cb.dataset.sel);
          cb.checked ? view.bulk.add(id) : view.bulk.delete(id);
          renderTab();
        })
      );
      document.querySelectorAll("[data-bulk]").forEach((b) =>
        b.addEventListener("click", () => {
          const act = b.dataset.bulk;
          const ids = [...view.bulk];
          if (act === "clear") { view.bulk.clear(); return renderTab(); }
          if (!ids.length) return;
          if (act === "delete") {
            if (!confirm(`¿Eliminar ${ids.length} producto(s)? Los del catálogo base pasarán a borrador.`)) return;
            deleteProducts(ids);
            AAO.aaoToast(`${ids.length} producto(s) eliminado(s)`);
          } else if (act === "deal-on" || act === "deal-off") {
            const deal = act === "deal-on";
            ids.forEach((id) => patchProduct(id, { deal, badge: deal ? "flash" : null }));
            AAO.aaoToast(deal ? "Activados en ofertas" : "Quitados de ofertas");
          } else {
            ids.forEach((id) => patchProduct(id, { estado: act }));
            AAO.aaoToast(act === "publicado" ? "Productos publicados" : "Enviados a borrador");
          }
          view.bulk.clear();
          renderTab();
        })
      );
    }

    /* ═══ CATEGORÍAS (CRUD) ═══ */
    if (view.tab === "categorias") {
      const customs = JSON.parse(localStorage.getItem("aao_categories_custom") || "[]");
      const overrides = JSON.parse(localStorage.getItem("aao_categories_overrides") || "{}");
      c.innerHTML = `
        <div class="box">
          <h2>Categorías (${AAO.CATEGORIES.length})</h2>
          <div class="admin-table-wrap"><table class="ptable admin-table">
            <thead><tr><th>Clave</th><th>Etiqueta</th><th>Productos</th><th>Tipo</th><th></th></tr></thead>
            <tbody>${AAO.CATEGORIES.map((cat) => {
              const count = AAO.ALL_PRODUCTS.filter((p) => p.cat === cat.name).length;
              const isCustom = customs.some((x) => x.name === cat.name);
              return `
              <tr>
                <td><strong>${esc(cat.name)}</strong></td>
                <td><input type="text" data-cat-label="${esc(cat.name)}" value="${esc(cat.label)}" style="border:1.5px solid var(--line);border-radius:8px;padding:6px 9px;font-size:.84rem"></td>
                <td class="num">${count}</td>
                <td>${isCustom ? '<span class="status status--info">Propia</span>' : '<span class="status">Base</span>'}</td>
                <td style="white-space:nowrap">
                  <button class="link-btn" data-cat-save="${esc(cat.name)}">Guardar</button>
                  ${isCustom ? ` · <button class="link-btn" data-cat-del="${esc(cat.name)}" style="color:#B91C1C">Eliminar</button>` : ""}
                </td>
              </tr>`;
            }).join("")}</tbody>
          </table></div>
          <form id="catForm" class="form-grid" style="margin-top:18px" novalidate>
            <div class="field"><label>Clave (sin espacios)</label><input name="name" placeholder="Deportes"></div>
            <div class="field"><label>Etiqueta visible</label><input name="label" placeholder="Deportes y aire libre"></div>
            <div class="field--full"><button class="btn btn--primary btn--sm" type="submit">Crear categoría</button></div>
          </form>
        </div>`;
      document.querySelectorAll("[data-cat-save]").forEach((b) =>
        b.addEventListener("click", () => {
          const name = b.dataset.catSave;
          const label = document.querySelector(`[data-cat-label="${name}"]`).value.trim();
          if (!label) return;
          const o = JSON.parse(localStorage.getItem("aao_categories_overrides") || "{}");
          o[name] = { label };
          localStorage.setItem("aao_categories_overrides", JSON.stringify(o));
          const cat = AAO.CATEGORIES.find((x) => x.name === name);
          if (cat) cat.label = label;
          AAO.CAT_LABELS[name] = label;
          AAO.aaoToast(`Categoría "${label}" actualizada`);
        })
      );
      document.querySelectorAll("[data-cat-del]").forEach((b) =>
        b.addEventListener("click", () => {
          const name = b.dataset.catDel;
          if (AAO.ALL_PRODUCTS.some((p) => p.cat === name)) { AAO.aaoToast("Tiene productos: no se puede eliminar"); return; }
          localStorage.setItem("aao_categories_custom", JSON.stringify(customs.filter((x) => x.name !== name)));
          AAO.aaoToast("Categoría eliminada");
          renderPanel();
        })
      );
      $("#catForm").addEventListener("submit", (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target).entries());
        const name = (data.name || "").trim().replace(/\s+/g, "");
        const label = (data.label || "").trim();
        if (!name || !label) return;
        if (AAO.CATEGORIES.some((x) => x.name === name)) { AAO.aaoToast("Ya existe esa clave"); return; }
        const cat = { name, label, icon: "chip", g: ["#0F766E", "#10B981"], extras: [] };
        const list = JSON.parse(localStorage.getItem("aao_categories_custom") || "[]");
        list.push(cat);
        localStorage.setItem("aao_categories_custom", JSON.stringify(list));
        AAO.CATEGORIES.push(cat);
        AAO.CAT_LABELS[name] = label;
        AAO.aaoToast(`Categoría "${label}" creada`);
        renderPanel();
      });
    }

    /* ═══ INVENTARIO: alertas + ajustes manuales ═══ */
    if (view.tab === "inventario") {
      c.innerHTML = `
        <div class="box">
          <h2>Control de inventario</h2>
          <p style="font-size:.84rem;color:var(--ink-soft);margin:-8px 0 16px">Ajusta el nivel de stock (porcentaje vendido). Alerta en niveles superiores al 60%.</p>
          ${m.lowStock.length ? `<span class="notif-pill">${m.lowStock.length} producto${m.lowStock.length > 1 ? "s" : ""} con stock bajo</span>` : ""}
          <div class="admin-table-wrap"><table class="ptable admin-table">
            <thead><tr><th></th><th>Producto</th><th>Nivel actual</th><th>Ajustar</th><th>Estado</th></tr></thead>
            <tbody>${AAO.ALL_PRODUCTS.map((p) => `
              <tr>
                <td><span class="ptable__img" style="background:linear-gradient(140deg, ${p.g[0]}, ${p.g[1]})">${AAO.icon(p.icon)}<img src="${p.img}" alt="" onerror="this.remove()"></span></td>
                <td>${esc(p.name)}</td>
                <td class="num">${p.stock}% vendido</td>
                <td><input type="number" min="0" max="95" value="${p.stock}" data-stock="${p.id}"></td>
                <td><span class="status ${p.stock > 65 ? "status--bad" : p.stock > 45 ? "status--warn" : "status--ok"}">${p.stock > 65 ? "Stock crítico" : p.stock > 45 ? "Stock bajo" : "OK"}</span></td>
              </tr>`).join("")}</tbody>
          </table></div>
        </div>`;
      document.querySelectorAll("[data-stock]").forEach((inp) =>
        inp.addEventListener("change", () => {
          const val = Math.max(0, Math.min(95, Number(inp.value) || 0));
          patchProduct(Number(inp.dataset.stock), { stock: val });
          AAO.aaoToast(`Stock actualizado al ${val}%`);
          renderTab();
        })
      );
    }

    /* ═══ CLIENTES: búsqueda + detalle con notas ═══ */
    if (view.tab === "clientes") {
      if (view.clientEmail) return renderClientDetail(c, view.clientEmail);
      let clients = Object.entries(AAO_AUTH.users()).filter(([, u]) => (u.role || "cliente") === "cliente")
        .map(([email, u]) => {
          const ords = AAO_AUTH.getOrders(email);
          const spent = ords.filter((o) => !["Cancelado", "Reembolsado"].includes(o.estado)).reduce((s, o) => s + o.total, 0);
          return { email, u, ords, spent };
        });
      if (view.clientQ) {
        const q = view.clientQ.toLowerCase();
        clients = clients.filter((x) => x.email.includes(q) || x.u.name.toLowerCase().includes(q));
      }
      clients.sort((a, b) => b.spent - a.spent);
      c.innerHTML = `
        <div class="box">
          <div class="admin-toolbar">
            <input type="search" id="cQ" placeholder="Buscar cliente" value="${esc(view.clientQ)}">
            <span class="spacer"></span><span class="result-count">${clients.length} cliente${clients.length !== 1 ? "s" : ""}</span>
          </div>
          <div class="admin-table-wrap"><table class="ptable">
            <thead><tr><th>Cliente</th><th>Email</th><th>Alta</th><th>Pedidos</th><th>Total comprado</th><th></th></tr></thead>
            <tbody>${clients.map((x) => `
              <tr>
                <td><strong>${esc(x.u.name)}</strong></td>
                <td>${esc(x.email)}</td>
                <td class="num">${fmtDate(x.u.reg || new Date().toISOString())}</td>
                <td class="num">${x.ords.length}</td>
                <td class="num"><strong>${AAO.fmt.format(x.spent)}</strong></td>
                <td><a class="link-btn" href="#cliente/${encodeURIComponent(x.email)}">Ver ficha</a></td>
              </tr>`).join("") || '<tr><td colspan="6" style="color:var(--ink-soft)">Sin clientes.</td></tr>'}</tbody>
          </table></div>
        </div>`;
      $("#cQ").addEventListener("input", (e) => { view.clientQ = e.target.value; renderTab(); });
    }

    /* ═══ CUPONES (CRUD completo) ═══ */
    if (view.tab === "cupones") {
      const coupons = AAO.allCoupons();
      c.innerHTML = `
        <div class="box">
          <h2>Cupones de descuento</h2>
          <div class="admin-table-wrap"><table class="ptable">
            <thead><tr><th>Código</th><th>Descripción</th><th>Descuento</th><th></th></tr></thead>
            <tbody>${Object.entries(coupons).map(([code, cp]) => `
              <tr>
                <td><strong style="font-family:var(--font-display)">${esc(code)}</strong></td>
                <td>${esc(cp.descripcion)}</td>
                <td class="num">${cp.tipo === "pct" ? `-${cp.valor}%` : `-${AAO.fmt.format(cp.valor)}`}</td>
                <td>${AAO.BASE_COUPONS && AAO.BASE_COUPONS[code] ? '<span class="status">Base</span>' : `<button class="link-btn" data-coupon-del="${esc(code)}" style="color:#B91C1C">Eliminar</button>`}</td>
              </tr>`).join("")}</tbody>
          </table></div>
          <form id="couponForm" class="form-grid" style="margin-top:18px" novalidate>
            <div class="field"><label>Código</label><input name="codigo" placeholder="VERANO25" style="text-transform:uppercase"></div>
            <div class="field"><label>Tipo</label>
              <select name="tipo"><option value="pct">Porcentaje (%)</option><option value="fijo">Importe fijo (€)</option></select>
            </div>
            <div class="field"><label>Valor</label><input name="valor" type="number" min="1" max="500" placeholder="25"></div>
            <div class="field--full"><button class="btn btn--primary btn--sm" type="submit">Crear cupón</button></div>
          </form>
        </div>`;
      document.querySelectorAll("[data-coupon-del]").forEach((b) =>
        b.addEventListener("click", () => {
          const all = JSON.parse(localStorage.getItem("aao_coupons") || "{}");
          delete all[b.dataset.couponDel];
          localStorage.setItem("aao_coupons", JSON.stringify(all));
          AAO.aaoToast("Cupón eliminado");
          renderTab();
        })
      );
      $("#couponForm").addEventListener("submit", (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target).entries());
        const code = (data.codigo || "").trim().toUpperCase();
        const valor = Number(data.valor);
        if (!code || !valor) return;
        const all = JSON.parse(localStorage.getItem("aao_coupons") || "{}");
        all[code] = { tipo: data.tipo, valor, descripcion: data.tipo === "pct" ? `-${valor}% con el código ${code}` : `-${AAO.fmt.format(valor)} con el código ${code}` };
        localStorage.setItem("aao_coupons", JSON.stringify(all));
        AAO.aaoToast(`Cupón ${code} creado`);
        renderTab();
      });
    }

    /* ═══ RESEÑAS: moderación ═══ */
    if (view.tab === "resenas") {
      if (!view.resenaProduct) view.resenaProduct = AAO.ALL_PRODUCTS[0].id;
      const prod = AAO.byId(view.resenaProduct) || AAO.ALL_PRODUCTS[0];
      const hidden = AAO.hiddenReviewIndexes()[prod.id] || [];
      const reviews = AAO.allReviewsFor(prod);
      c.innerHTML = `
        <div class="box">
          <h2>Moderación de reseñas</h2>
          <div class="admin-toolbar">
            <select id="resProd">${AAO.ALL_PRODUCTS.map((p) => `<option value="${p.id}" ${p.id === prod.id ? "selected" : ""}>${esc(p.name)}</option>`).join("")}</select>
            <span class="spacer"></span>
            <span class="result-count">${reviews.length - hidden.length} visibles · ${hidden.length} ocultas</span>
          </div>
          ${reviews.map((r, i) => `
            <div class="order-card">
              <div class="order-card__head">
                <div><strong>${esc(r.name)}</strong> <span class="order-card__meta">· ${r.date} · ${r.rating}/5</span></div>
                <button class="btn btn--outline btn--sm" data-review-toggle="${i}">${hidden.includes(i) ? "Restaurar" : "Ocultar"}</button>
              </div>
              <p style="font-weight:600;font-size:.9rem;margin-top:8px">${esc(r.title)}</p>
              <p style="font-size:.85rem;color:var(--ink-soft)">${esc(r.text)}</p>
            </div>`).join("")}
        </div>`;
      $("#resProd").addEventListener("change", (e) => { view.resenaProduct = Number(e.target.value); renderTab(); });
      document.querySelectorAll("[data-review-toggle]").forEach((b) =>
        b.addEventListener("click", () => {
          const idx = Number(b.dataset.reviewToggle);
          const all = JSON.parse(localStorage.getItem("aao_reviews_hidden") || "{}");
          const list = new Set(all[prod.id] || []);
          list.has(idx) ? list.delete(idx) : list.add(idx);
          all[prod.id] = [...list];
          localStorage.setItem("aao_reviews_hidden", JSON.stringify(all));
          renderTab();
        })
      );
    }

    /* ═══ REPORTES ═══ */
    if (view.tab === "reportes") {
      const byCat = {};
      m.valid.forEach((o) => o.items.forEach((it) => {
        const p = AAO.byId(it.id);
        const cat = p ? (AAO.CAT_LABELS[p.cat] || p.cat) : "Otros";
        byCat[cat] = (byCat[cat] || 0) + it.precio * it.qty;
      }));
      const maxCat = Math.max(...Object.values(byCat), 1);
      const unidades = m.valid.reduce((s, o) => s + o.items.reduce((a, i) => a + i.qty, 0), 0);
      c.innerHTML = `
        <div class="dash-cards">
          <div class="dash-card"><b>${AAO.fmt.format(m.sales)}</b><span>Ingresos totales</span></div>
          <div class="dash-card"><b>${m.valid.length}</b><span>Pedidos</span></div>
          <div class="dash-card"><b>${unidades}</b><span>Unidades vendidas</span></div>
          <div class="dash-card"><b>${AAO.fmt.format(m.valid.length ? m.sales / m.valid.length : 0)}</b><span>Ticket medio</span></div>
        </div>
        <div class="dash-grid">
          <div class="box"><h2>Ventas últimos 7 días</h2>
            <div class="chart">${m.last7.map((d) => `
              <div class="chart__col"><b>${d.total ? AAO.fmt.format(d.total) : "—"}</b>
              <div class="chart__bar" style="height:${Math.max(4, (d.total / m.maxDay) * 110)}px"></div>
              <span>${d.label}</span></div>`).join("")}</div>
          </div>
          <div class="box"><h2>Ingresos por categoría</h2>
            ${Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([cat, v]) => `
              <div class="review-line"><span>${esc(cat)}</span><span class="num"><strong>${AAO.fmt.format(v)}</strong></span></div>`).join("") || '<p style="font-size:.86rem;color:var(--ink-soft)">Sin datos.</p>'}
          </div>
        </div>
        <div class="box" style="margin-top:16px">
          <h2>Top productos</h2>
          ${m.top.map(({ p, n }) => `
            <div class="review-line"><span><strong>${n} uds</strong> · ${esc(p.name)}</span><span class="num">${AAO.fmt.format(n * p.price)}</span></div>`).join("") || '<p style="font-size:.86rem;color:var(--ink-soft)">Sin ventas.</p>'}
          <button class="btn btn--outline btn--sm" id="csvBtn" style="margin-top:14px">Exportar pedidos (CSV)</button>
        </div>`;
      $("#csvBtn").addEventListener("click", () => {
        try {
          const rows = [["Pedido", "Fecha", "Cliente", "Estado", "Subtotal", "Descuento", "Envio", "Total"]];
          m.orders.forEach((o) => rows.push([o.id, o.fecha, o.cliente, o.estado, o.subtotal.toFixed(2), o.descuento.toFixed(2), o.envio.toFixed(2), o.total.toFixed(2)]));
          const blob = new Blob([rows.map((r) => r.join(";")).join("\n")], { type: "text/csv" });
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = "pedidos-allatonce.csv";
          a.click();
          AAO.aaoToast("CSV descargado");
        } catch (e) { AAO.aaoToast("Exportación no disponible en este navegador"); }
      });
    }

    /* ═══ ENVÍOS / PAGOS / CONFIGURACIÓN / USUARIOS (superadmin) ═══ */
    if (view.tab === "envios") {
      const methods = AAO.shippingMethods();
      c.innerHTML = `
        <div class="box">
          <h2>Métodos de envío</h2>
          <p style="font-size:.84rem;color:var(--ink-soft);margin:-8px 0 16px">Estos métodos aparecen en el checkout de la tienda.</p>
          <div class="admin-table-wrap"><table class="ptable admin-table">
            <thead><tr><th>Método</th><th>Precio</th><th>Gratis desde</th><th>Extra</th><th>Días</th><th>Activo</th></tr></thead>
            <tbody>${methods.map((mt, i) => `
              <tr>
                <td><strong>${esc(mt.nombre)}</strong><br><small style="color:var(--ink-soft)">${esc(mt.desc)}</small></td>
                <td><input type="number" step="0.01" data-ship="${i}:precio" value="${mt.precio}"></td>
                <td><input type="number" step="0.01" data-ship="${i}:gratisDesde" value="${mt.gratisDesde ?? ""}" placeholder="—"></td>
                <td><input type="number" step="0.01" data-ship="${i}:extra" value="${mt.extra || 0}"></td>
                <td><input type="number" data-ship="${i}:dias" value="${mt.dias}"></td>
                <td><input type="checkbox" data-ship="${i}:activo" ${mt.activo ? "checked" : ""}></td>
              </tr>`).join("")}</tbody>
          </table></div>
          <button class="btn btn--primary btn--sm" id="saveShip" style="margin-top:14px">Guardar cambios</button>
        </div>`;
      $("#saveShip").addEventListener("click", () => {
        const out = methods.map((mt, i) => ({ ...mt }));
        document.querySelectorAll("[data-ship]").forEach((inp) => {
          const [idx, key] = inp.dataset.ship.split(":");
          out[Number(idx)][key] = inp.type === "checkbox" ? inp.checked : (key === "gratisDesde" && inp.value === "" ? null : Number(inp.value));
        });
        localStorage.setItem("aao_shipping_methods", JSON.stringify(out));
        AAO.aaoToast("Métodos de envío actualizados");
      });
    }

    if (view.tab === "pagos") {
      const methods = AAO.paymentMethods();
      c.innerHTML = `
        <div class="box">
          <h2>Métodos de pago</h2>
          <p style="font-size:.84rem;color:var(--ink-soft);margin:-8px 0 16px">Los métodos activos se ofrecen en el checkout.</p>
          ${methods.map((mt, i) => `
            <label class="payopt ${mt.activo ? "is-active" : ""}">
              <input type="checkbox" data-pay="${i}" ${mt.activo ? "checked" : ""}>
              <div><strong>${esc(mt.nombre)}</strong><small>${esc(mt.desc)}</small></div>
            </label>`).join("")}
          <button class="btn btn--primary btn--sm" id="savePay" style="margin-top:8px">Guardar cambios</button>
        </div>`;
      $("#savePay").addEventListener("click", () => {
        const out = methods.map((mt, i) => ({ ...mt, activo: document.querySelector(`[data-pay="${i}"]`).checked }));
        localStorage.setItem("aao_payment_methods", JSON.stringify(out));
        AAO.aaoToast("Métodos de pago actualizados");
      });
    }

    if (view.tab === "configuracion") {
      const s = AAO.SETTINGS;
      c.innerHTML = `
        <div class="box">
          <h2>Ajustes generales de la tienda</h2>
          <div class="form-grid">
            <div class="field"><label>Nombre de la tienda</label><input id="sTienda" value="${esc(s.tienda)}"></div>
            <div class="field"><label>Moneda</label>
              <select id="sMoneda">${["EUR", "USD", "GBP"].map((x) => `<option ${s.moneda === x ? "selected" : ""}>${x}</option>`).join("")}</select>
            </div>
            <div class="field"><label>IVA (%)</label><input id="sIva" type="number" min="0" max="40" value="${s.iva}"></div>
            <div class="field"><label>Envío gratis desde (€)</label><input id="sGratis" type="number" min="0" value="${s.envioGratis}"></div>
            <div class="field"><label>Coste envío estándar (€)</label><input id="sCoste" type="number" step="0.01" min="0" value="${s.envioCoste}"></div>
          </div>
          <button class="btn btn--primary btn--sm" id="saveSettings" style="margin-top:14px">Guardar ajustes</button>
          <p style="font-size:.78rem;color:var(--ink-soft);margin-top:10px">Los cambios se aplican en la tienda al recargar las páginas.</p>
        </div>`;
      $("#saveSettings").addEventListener("click", () => {
        localStorage.setItem("aao_settings", JSON.stringify({
          tienda: $("#sTienda").value.trim() || "All At Once",
          moneda: $("#sMoneda").value,
          iva: Number($("#sIva").value) || 21,
          envioGratis: Number($("#sGratis").value) || 75,
          envioCoste: Number($("#sCoste").value) || 4.99,
        }));
        AAO.aaoToast("Ajustes guardados — recarga la tienda para aplicarlos");
      });
    }

    if (view.tab === "usuarios") {
      const all = AAO_AUTH.users();
      const s = AAO_AUTH.session();
      c.innerHTML = `
        <div class="box">
          <h2>Usuarios y roles</h2>
          <div class="admin-table-wrap"><table class="ptable admin-table">
            <thead><tr><th>Usuario</th><th>Email</th><th>Rol</th><th>Alta</th><th></th></tr></thead>
            <tbody>${Object.entries(all).map(([email, u]) => `
              <tr>
                <td><strong>${esc(u.name)}</strong>${s.email === email ? ' <span class="status status--info">Tú</span>' : ""}</td>
                <td>${esc(email)}</td>
                <td><select data-role="${esc(email)}">
                  ${["cliente", "superadmin", "admin"].map((r) => `<option value="${r}" ${(u.role || "cliente") === r ? "selected" : ""}>${r}</option>`).join("")}
                </select></td>
                <td class="num">${fmtDate(u.reg || new Date().toISOString())}</td>
                <td>${s.email !== email ? `<button class="link-btn" data-user-del="${esc(email)}" style="color:#B91C1C">Eliminar</button>` : ""}</td>
              </tr>`).join("")}</tbody>
          </table></div>
          <form id="userForm" class="form-grid" style="margin-top:18px" novalidate>
            <div class="field"><label>Nombre</label><input name="name" placeholder="Nuevo editor"></div>
            <div class="field"><label>Email</label><input name="email" type="email" placeholder="equipo@allatonce.com"></div>
            <div class="field"><label>Rol</label>
              <select name="role"><option value="admin">admin (catálogo + ventas)</option><option value="superadmin">superadmin (acceso total)</option><option value="cliente">cliente</option></select>
            </div>
            <div class="field"><label>Contraseña temporal</label><input name="pass" placeholder="Mínimo 6 caracteres"></div>
            <div class="field--full"><button class="btn btn--primary btn--sm" type="submit">Crear usuario</button></div>
          </form>
        </div>`;
      document.querySelectorAll("[data-role]").forEach((sel) =>
        sel.addEventListener("change", () => {
          const res = AAO_AUTH.setRole(sel.dataset.role, sel.value);
          if (!res.ok) { AAO.aaoToast(res.error); renderTab(); return; }
          AAO.aaoToast(`Rol actualizado → ${sel.value}`);
        })
      );
      document.querySelectorAll("[data-user-del]").forEach((b) =>
        b.addEventListener("click", () => {
          const res = AAO_AUTH.deleteUser(b.dataset.userDel);
          AAO.aaoToast(res.ok ? "Usuario eliminado" : res.error);
          renderTab();
        })
      );
      $("#userForm").addEventListener("submit", (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target).entries());
        const res = AAO_AUTH.createUser(data);
        AAO.aaoToast(res.ok ? `Usuario ${data.email} creado` : res.error);
        if (res.ok) renderTab();
      });
    }
  }

  /* ─────────── Detalle de pedido (3.4) ─────────── */
  function renderOrderDetail(c, id) {
    const o = AAO_AUTH.getOrder(id);
    if (!o) { c.innerHTML = `<div class="box"><p>Pedido no encontrado.</p></div>`; return; }
    c.innerHTML = `
      <a class="link-btn" href="#pedidos" style="display:inline-block;margin-bottom:14px">‹ Volver a pedidos</a>
      <div class="box">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
          <h2 style="margin:0">Pedido ${o.id}</h2>
          <span class="status ${statusClass(o.estado)}">${o.estado}</span>
        </div>
        <p style="font-size:.83rem;color:var(--ink-soft);margin-top:6px">${fmtDateTime(o.fecha)} · ${esc(o.pago)} · Cliente: <strong>${esc(o.nombreCliente)}</strong> (${esc(o.cliente)})</p>
        <hr style="border:none;border-top:1px solid var(--line);margin:18px 0">
        <div class="form-grid">
          <div class="field">
            <label>Estado del pedido</label>
            <select id="odEstado">${ESTADOS.map((e) => `<option ${e === o.estado ? "selected" : ""}>${e}</option>`).join("")}</select>
          </div>
          <div class="field">
            <label>Nº de seguimiento</label>
            <input id="odTracking" value="${esc(o.tracking || "")}">
          </div>
        </div>
        <button class="btn btn--primary btn--sm" id="odSave" style="margin:6px 0 16px">Guardar cambios y notificar</button>
        <hr style="border:none;border-top:1px solid var(--line);margin:6px 0 16px">
        ${o.items.map((it) => `
          <div class="review-line"><span><strong>${it.qty} ×</strong> ${esc(it.nombre)}</span><span class="num">${AAO.fmt.format(it.precio * it.qty)}</span></div>`).join("")}
        <div class="review-line"><span>Subtotal</span><span class="num">${AAO.fmt.format(o.subtotal)}</span></div>
        ${o.descuento ? `<div class="review-line" style="color:var(--green)"><span>Descuento (${esc(o.cupon || "")})</span><span class="num">−${AAO.fmt.format(o.descuento)}</span></div>` : ""}
        <div class="review-line"><span>Envío</span><span class="num">${o.envio === 0 ? "Gratis" : AAO.fmt.format(o.envio)}</span></div>
        <div class="review-line" style="border:none"><span><strong>Total</strong></span><strong class="num" style="font-size:1.1rem">${AAO.fmt.format(o.total)}</strong></div>
        <hr style="border:none;border-top:1px solid var(--line);margin:16px 0">
        <p style="font-size:.85rem;color:var(--ink-soft);line-height:1.7">
          <strong style="color:var(--ink)">Dirección de envío</strong><br>
          ${esc(o.direccion.nombre)} · ${esc(o.direccion.direccion)}, ${esc(o.direccion.cp)} ${esc(o.direccion.ciudad)} (${esc(o.direccion.provincia)}), ${esc(o.direccion.pais)}<br>
          ${esc(o.direccion.email)} · ${esc(o.direccion.telefono)}
        </p>
        <button class="btn btn--outline btn--sm" id="odInvoice" style="margin-top:8px">Imprimir factura</button>
      </div>`;
    $("#odSave").addEventListener("click", () => {
      const estado = $("#odEstado").value;
      const tracking = $("#odTracking").value.trim();
      const cambioEstado = estado !== o.estado;
      AAO_AUTH.updateOrder(o.id, { estado, tracking });
      if (cambioEstado) AAO_AUTH.notify(o.cliente, `Tu pedido ${o.id} ahora está: ${estado}`);
      AAO.aaoToast(cambioEstado ? "Guardado — email de notificación enviado al cliente" : "Cambios guardados");
    });
    $("#odInvoice").addEventListener("click", () => printInvoice(AAO_AUTH.getOrder(o.id)));
  }

  /* ─────────── Detalle de cliente (notas internas) ─────────── */
  function renderClientDetail(c, email) {
    const u = AAO_AUTH.find(email);
    if (!u) { c.innerHTML = `<div class="box"><p>Cliente no encontrado.</p></div>`; return; }
    const ords = AAO_AUTH.getOrders(email);
    const notes = AAO_AUTH.getNotes(email);
    c.innerHTML = `
      <a class="link-btn" href="#clientes" style="display:inline-block;margin-bottom:14px">‹ Volver a clientes</a>
      <div class="box">
        <h2>${esc(u.name)}</h2>
        <p style="font-size:.86rem;color:var(--ink-soft)">${esc(email)} · Cliente desde ${fmtDate(u.reg || new Date().toISOString())}${u.phone ? " · " + esc(u.phone) : ""}</p>
        <hr style="border:none;border-top:1px solid var(--line);margin:16px 0">
        <h2 style="font-size:1rem">Historial de compras (${ords.length})</h2>
        ${ords.map((o) => `
          <div class="review-line">
            <span><a class="rowlink" href="#pedido/${o.id}">${o.id}</a> · ${fmtDate(o.fecha)}</span>
            <span><span class="status ${statusClass(o.estado)}">${o.estado}</span> <strong class="num" style="margin-left:8px">${AAO.fmt.format(o.total)}</strong></span>
          </div>`).join("") || '<p style="font-size:.85rem;color:var(--ink-soft)">Sin pedidos.</p>'}
      </div>
      <div class="box">
        <h2>Notas internas</h2>
        <form id="noteForm" style="display:flex;gap:8px;margin-bottom:14px">
          <input id="noteText" placeholder="Añadir nota interna (solo visible para el equipo)…" style="flex:1;border:1.5px solid var(--line);border-radius:10px;padding:10px 12px;font-size:.86rem;outline:none">
          <button class="btn btn--primary btn--sm" type="submit">Añadir</button>
        </form>
        ${notes.map((n) => `<div class="review-line"><span>${esc(n.text)}</span><span class="num" style="color:var(--ink-soft)">${fmtDateTime(n.fecha)}</span></div>`).join("") || '<p style="font-size:.85rem;color:var(--ink-soft)">Sin notas.</p>'}
      </div>`;
    $("#noteForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const text = $("#noteText").value.trim();
      if (!text) return;
      AAO_AUTH.addNote(email, text);
      AAO.aaoToast("Nota guardada");
      renderTab();
    });
  }

  /* ─────────── Formulario de producto (3.3) ─────────── */
  function renderProductForm(c, editId) {
    const isNew = editId === "new";
    const p = isNew ? null : AAO.ALL_PRODUCTS.find((x) => x.id === Number(editId));
    if (!isNew && !p) { view.productEdit = null; return renderTab(); }
    const v = (k, dflt = "") => (p && p[k] != null ? p[k] : dflt);
    const catsAct = Array.isArray(p && p.cats) && p.cats.length ? p.cats : [v("cat") || "Tech"];
    const variantsArr = Array.isArray(p && p.variantes) ? p.variantes : [];
    const imgsArr = Array.isArray(p && p.imagenes) && p.imagenes.length ? p.imagenes : (v("img") ? [v("img")] : []);

    c.innerHTML = `
      <a class="link-btn" href="#productos" style="display:inline-block;margin-bottom:14px">‹ Volver a productos</a>
      <div class="box">
        <h2>${isNew ? "Crear producto" : `Editar: ${esc(p.name)}`}</h2>
        <div class="form-grid">
          <div class="field field--full"><label>Nombre *</label><input id="fpName" value="${esc(v("name"))}"></div>
          <div class="field"><label>Slug (URL)</label><input id="fpSlug" value="${esc(v("slug"))}" placeholder="se genera del nombre"></div>
          <div class="field"><label>SKU / código de barras</label><input id="fpSku" value="${esc(v("sku"))}" placeholder="AAO-0000"></div>
          <div class="field field--full"><label>Descripción corta</label><input id="fpDescCorta" value="${esc(v("descCorta"))}" placeholder="Una línea que resume el producto"></div>
          <div class="field field--full"><label>Descripción larga</label><textarea id="fpDescLarga" style="border:1.5px solid #D8D0C6;border-radius:10px;padding:11px 13px;font-size:.92rem;min-height:90px;outline:none">${esc(v("descLarga"))}</textarea></div>
          <div class="field field--full"><label>Categorías * <small style="font-weight:500;color:var(--adm-muted)">(la primera marcada es la principal)</small></label>
            <div class="chipchecks" id="fpCats">
              ${AAO.CATEGORIES.map((cat, i) => `
                <label class="chipcheck"><input type="checkbox" value="${cat.name}" ${catsAct.includes(cat.name) ? "checked" : ""}> ${cat.label}</label>`).join("")}
            </div>
          </div>
          <div class="field"><label>Etiquetas (separadas por comas)</label><input id="fpTags" value="${esc(Array.isArray(v("etiquetas")) ? v("etiquetas").join(", ") : "")}" placeholder="nuevo, oferta, top"></div>
          <div class="field"><label>Precio (€) *</label><input id="fpPrice" type="number" step="0.01" value="${v("price", "")}"></div>
          <div class="field"><label>Precio anterior / tachado (€)</label><input id="fpOld" type="number" step="0.01" value="${p && p.old !== p.price ? v("old") : ""}" placeholder="opcional"></div>
          <div class="field"><label>Costo (margen interno, €)</label><input id="fpCost" type="number" step="0.01" value="${esc(v("costo"))}" placeholder="opcional"></div>
          <div class="field"><label>Stock (% vendido, 0–95)</label><input id="fpStock" type="number" min="0" max="95" value="${v("stock", 20)}"></div>
          <div class="field field--full"><label>Variantes (talla · color · stock individual)</label>
            <div id="fpVariants">
              ${variantsArr.length ? variantsArr.map((vr) => variantRowHTML(vr)).join("") : variantRowHTML({})}
            </div>
            <button type="button" class="btn btn--outline btn--sm" id="fpAddVariant" style="margin-top:4px">+ Añadir variante</button>
          </div>
          <div class="field field--full"><label>Imágenes <small style="font-weight:500;color:var(--adm-muted)">(la primera es la principal; usa ↑↓ para ordenar)</small></label>
            <div id="fpImages">
              ${imgsArr.length ? imgsArr.map((src) => imageRowHTML(src)).join("") : imageRowHTML("")}
            </div>
            <button type="button" class="btn btn--outline btn--sm" id="fpAddImage" style="margin-top:4px">+ Añadir imagen</button>
          </div>
          <div class="field"><label>Peso (kg) / dimensiones</label><input id="fpPeso" value="${esc(v("peso"))}" placeholder="0,5 kg · 20 × 15 × 8 cm"></div>
          <div class="field"><label>Estado</label>
            <select id="fpEstado">
              <option value="publicado" ${v("estado", "publicado") === "publicado" ? "selected" : ""}>Publicado</option>
              <option value="borrador" ${v("estado") === "borrador" ? "selected" : ""}>Borrador</option>
              <option value="agotado" ${v("estado") === "agotado" ? "selected" : ""}>Agotado</option>
            </select>
          </div>
          <div class="field"><label>Meta título (SEO)</label><input id="fpMetaT" value="${esc(v("metaTitulo"))}" placeholder="Título para buscadores"></div>
          <div class="field"><label>Meta descripción (SEO)</label><input id="fpMetaD" value="${esc(v("metaDescripcion"))}" placeholder="Descripción para buscadores"></div>
        </div>
        <label class="terms" style="margin:14px 0 0"><input type="checkbox" id="fpDeal" ${v("deal") ? "checked" : ""}><span>Incluir en la sección de Ofertas flash</span></label>
        <div style="display:flex;gap:10px;margin-top:18px">
          <button class="btn btn--primary" id="fpSave">${isNew ? "Crear producto" : "Guardar cambios"}</button>
          <a class="btn btn--outline" href="#productos">Cancelar</a>
        </div>
      </div>`;

    $("#fpName").addEventListener("input", (e) => { if (isNew || !$("#fpSlug").value) $("#fpSlug").value = slugify(e.target.value); });
    bindFormRows();
    $("#fpSave").addEventListener("click", () => {
      const name = $("#fpName").value.trim();
      const price = Number($("#fpPrice").value);
      if (!name || !price) { AAO.aaoToast("Nombre y precio son obligatorios"); return; }
      const { variantes, imagenes, cats } = readFormRows();
      if (!cats.length) { AAO.aaoToast("Marca al menos una categoría"); return; }
      const cat = cats[0];
      const catDef = AAO.CATEGORIES.find((x) => x.name === cat) || {};
      const deal = $("#fpDeal").checked;
      const data = {
        name,
        slug: $("#fpSlug").value.trim() || slugify(name),
        sku: $("#fpSku").value.trim(),
        descCorta: $("#fpDescCorta").value.trim(),
        descLarga: $("#fpDescLarga").value.trim(),
        cats,
        cat,
        etiquetas: $("#fpTags").value.split(",").map((x) => x.trim()).filter(Boolean),
        price,
        old: Number($("#fpOld").value) || Math.round(price * 1.3 * 100) / 100,
        costo: Number($("#fpCost").value) || 0,
        stock: Math.max(0, Math.min(95, Number($("#fpStock").value) || 0)),
        variantes,
        imagenes,
        img: imagenes[0] || "",
        peso: $("#fpPeso").value.trim(),
        estado: $("#fpEstado").value,
        metaTitulo: $("#fpMetaT").value.trim(),
        metaDescripcion: $("#fpMetaD").value.trim(),
        deal,
        badge: deal ? "flash" : null,
      };
      if (isNew) {
        createProduct({
          ...data,
          id: Date.now(),
          rating: 4.5, reviews: 0, prime: true,
          g: catDef.g || ["#64748B", "#334155"],
          icon: catDef.icon || "chip",
        });
        AAO.aaoToast(`Producto "${name}" creado`);
      } else {
        patchProduct(p.id, data);
        AAO.aaoToast(`Producto "${name}" actualizado`);
      }
      view.productEdit = null;
      location.hash = "#productos";
    });
  }

  /* ─────────── Init ─────────── */
  window.addEventListener("hashchange", () => {
    if (!AAO_AUTH.isAdmin()) return;
    renderPanel();
    window.scrollTo(0, 0);
  });

  if (AAO_AUTH.isAdmin()) renderPanel();
  else renderLogin();

  window.AAO_ADMIN = { view, invoiceHTML, metrics, patchProduct, createProduct, deleteProducts };
})();
