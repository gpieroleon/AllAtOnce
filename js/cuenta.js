/* ═══════════════════════════════════════════════════════════
   ALL AT ONCE — Panel del cliente (cuenta.html)
   Resumen, pedidos con tracking, direcciones y datos
   personales. Referencia: sección 2.5 de la especificación.
   ═══════════════════════════════════════════════════════════ */

"use strict";

(function () {
  const $ = (sel) => document.querySelector(sel);
  const root = $("#accountRoot");

  /* Guard: requiere sesión de CLIENTE (el staff va al panel admin) */
  const session = AAO_AUTH.session();
  if (session && session.role !== "cliente") {
    window.location.replace("admin.html");
    return;
  }
  if (!session) {
    window.location.replace("login.html?from=" + encodeURIComponent("cuenta.html" + location.hash));
    return;
  }

  const ESTADOS = ["Pendiente de pago", "Pagado", "En preparación", "Enviado", "Entregado"];
  const statusClass = (e) => ({
    "Pendiente de pago": "status--warn", Pagado: "status--info",
    "En preparación": "status--info", Enviado: "status--ok", Entregado: "status--ok",
    Cancelado: "status--bad", Reembolsado: "status--bad",
  }[e] || "");

  let orders = AAO_AUTH.getOrders(session.email);
  let addresses = AAO_AUTH.getAddresses(session.email);
  let tab = (location.hash || "#resumen").slice(1);
  let detailOrder = null;

  const fmtDate = (iso) => new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });

  function orderCard(o) {
    return `
      <div class="order-card">
        <div class="order-card__head">
          <div>
            <span class="order-card__id">${o.id}</span>
            <span class="order-card__meta"> · ${fmtDate(o.fecha)} · ${o.items.reduce((s, i) => s + i.qty, 0)} artículos</span>
          </div>
          <span class="status ${statusClass(o.estado)}">${o.estado}</span>
        </div>
        <div class="order-card__items">
          ${o.items.slice(0, 5).map((it) => `
            <span class="order-card__thumb" style="background:linear-gradient(140deg, ${it.g[0]}, ${it.g[1]})">
              ${AAO.icon(it.icon)}<img src="${it.img}" alt="" onerror="this.remove()">
            </span>`).join("")}
          <span class="order-card__total">${AAO.fmt.format(o.total)}</span>
        </div>
        <div style="margin-top:12px"><button class="btn btn--outline btn--sm" data-detail="${o.id}">Ver detalle y seguimiento</button></div>
      </div>`;
  }

  function detailView(o) {
    const idx = ESTADOS.indexOf(o.estado);
    return `
      <button class="link-btn" id="backOrders" style="margin-bottom:16px">‹ Volver a mis pedidos</button>
      <div class="box">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
          <h2 style="margin:0">Pedido ${o.id}</h2>
          <span class="status ${statusClass(o.estado)}">${o.estado}</span>
        </div>
        <p style="font-size:.83rem;color:var(--ink-soft);margin-top:6px">${fmtDate(o.fecha)} · Pago: ${o.pago} · Nº de seguimiento: <strong>${o.tracking}</strong></p>
        ${!["Cancelado", "Reembolsado"].includes(o.estado) ? `
        <div class="track">
          ${ESTADOS.map((e, i) => `
            <div class="track__step ${i <= idx ? "is-done" : ""}">
              <span class="track__dot">${AAO.icon("check")}</span>
              <span>${e}</span>
            </div>`).join("")}
        </div>` : `<p class="form-alert is-show" style="margin-top:14px">Este pedido fue ${o.estado.toLowerCase()}.</p>`}
        <hr style="border:none;border-top:1px solid var(--line);margin:20px 0">
        ${o.items.map((it) => `
          <div class="review-line">
            <span><strong>${it.qty} ×</strong> <a href="producto.html?id=${it.id}" style="font-weight:600">${it.nombre}</a></span>
            <span class="num">${AAO.fmt.format(it.precio * it.qty)}</span>
          </div>`).join("")}
        <div class="review-line"><span>Subtotal</span><span class="num">${AAO.fmt.format(o.subtotal)}</span></div>
        ${o.descuento ? `<div class="review-line" style="color:var(--green)"><span>Descuento (${o.cupon})</span><span class="num">−${AAO.fmt.format(o.descuento)}</span></div>` : ""}
        <div class="review-line"><span>Envío</span><span class="num">${o.envio === 0 ? "Gratis" : AAO.fmt.format(o.envio)}</span></div>
        <div class="review-line" style="border:none"><span><strong>Total</strong></span><strong class="num" style="font-size:1.1rem">${AAO.fmt.format(o.total)}</strong></div>
        <hr style="border:none;border-top:1px solid var(--line);margin:20px 0">
        <p style="font-size:.85rem;color:var(--ink-soft);line-height:1.7">
          <strong style="color:var(--ink)">Dirección de envío</strong><br>
          ${o.direccion.nombre} · ${o.direccion.direccion}, ${o.direccion.cp} ${o.direccion.ciudad} (${o.direccion.provincia}), ${o.direccion.pais}<br>
          ${o.direccion.email} · ${o.direccion.telefono}
        </p>
      </div>`;
  }

  function render() {
    const user = AAO_AUTH.find(session.email);
    const totalSpent = orders.filter((o) => !["Cancelado", "Reembolsado"].includes(o.estado)).reduce((s, o) => s + o.total, 0);
    const favs = JSON.parse(localStorage.getItem("aao_wishlist") || "[]").length;

    const tabs = [
      ["resumen", "Resumen", '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>'],
      ["pedidos", "Mis pedidos", '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/></svg>'],
      ["direcciones", "Direcciones", '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>'],
      ["datos", "Datos personales", '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.5-6.5 8-6.5s8 2.5 8 6.5"/></svg>'],
    ];

    root.innerHTML = `
      <div class="page-head">
        <h1>Hola, ${session.name}</h1>
        <p>${session.email}</p>
      </div>
      <div class="account-layout">
        <nav class="account-nav" aria-label="Secciones de la cuenta">
          ${tabs.map(([id, label, svg]) => `<button data-tab="${id}" class="${tab === id ? "is-active" : ""}">${svg}${label}</button>`).join("")}
          <button id="logoutSide" style="color:#B91C1C"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>Cerrar sesión</button>
        </nav>

        <div>
          <!-- RESUMEN -->
          <section class="account-tab ${tab === "resumen" ? "is-active" : ""}" id="tab-resumen">
            <div class="stat-cards">
              <div class="stat-card"><b>${orders.length}</b><span>Pedidos realizados</span></div>
              <div class="stat-card"><b>${AAO.fmt.format(totalSpent)}</b><span>Total comprado</span></div>
              <div class="stat-card"><b>${favs}</b><span>Favoritos guardados</span></div>
            </div>
            <div class="box">
              <h2>Pedidos recientes</h2>
              ${orders.length ? orders.slice(0, 3).map(orderCard).join("") : `<p style="color:var(--ink-soft);font-size:.9rem">Aún no has hecho ningún pedido. <a href="categoria.html?cat=ofertas" style="color:var(--accent);font-weight:600">Descubrir ofertas</a></p>`}
            </div>
            <div class="box">
              <h2>Accesos rápidos</h2>
              <div style="display:flex;gap:10px;flex-wrap:wrap">
                <a class="btn btn--outline btn--sm" href="favoritos.html">Mis favoritos</a>
                <a class="btn btn--outline btn--sm" href="carrito.html">Mi cesta</a>
                <a class="btn btn--outline btn--sm" href="direcciones.html" onclick="return false" data-goto-tab="direcciones">Gestionar direcciones</a>
                <a class="btn btn--outline btn--sm" href="contacto.html">Ayuda y contacto</a>
              </div>
            </div>
          </section>

          <!-- PEDIDOS -->
          <section class="account-tab ${tab === "pedidos" ? "is-active" : ""}" id="tab-pedidos">
            ${detailOrder ? detailView(detailOrder) : `
              <div class="box">
                <h2>Mis pedidos</h2>
                ${orders.length ? orders.map(orderCard).join("") : `<p style="color:var(--ink-soft);font-size:.9rem">No tienes pedidos todavía.</p>`}
              </div>`}
          </section>

          <!-- DIRECCIONES -->
          <section class="account-tab ${tab === "direcciones" ? "is-active" : ""}" id="tab-direcciones">
            <div class="box">
              <h2>Direcciones de envío</h2>
              <div class="addr-grid" id="addrGrid">
                ${addresses.map((a, i) => `
                  <div class="addr-card ${i === 0 ? "is-default" : ""}">
                    ${i === 0 ? '<span class="addr-card__badge">Principal</span>' : ""}
                    <strong>${a.nombre}</strong>
                    <p>${a.direccion}<br>${a.cp} ${a.ciudad} (${a.provincia}), ${a.pais}<br>Tel: ${a.telefono}</p>
                    <div class="addr-card__actions">
                      <button class="link-btn" data-addr-del="${i}">Eliminar</button>
                    </div>
                  </div>`).join("")}
                <button class="addr-card addr-card--new" id="addrNew">+ Añadir dirección</button>
              </div>
              <form id="addrForm" class="form-grid" style="display:none;margin-top:18px" novalidate>
                <div class="field"><label>Nombre del contacto</label><input name="nombre" required></div>
                <div class="field"><label>Teléfono</label><input name="telefono" required></div>
                <div class="field field--full"><label>Dirección</label><input name="direccion" required></div>
                <div class="field"><label>Ciudad</label><input name="ciudad" required></div>
                <div class="field"><label>Provincia</label><input name="provincia" required></div>
                <div class="field"><label>Código postal</label><input name="cp" maxlength="5" required></div>
                <div class="field"><label>País</label>
                  <select name="pais"><option>España</option><option>Italia</option><option>Francia</option><option>Portugal</option></select>
                </div>
                <div class="field--full" style="display:flex;gap:10px">
                  <button type="submit" class="btn btn--primary btn--sm">Guardar dirección</button>
                  <button type="button" class="btn btn--outline btn--sm" id="addrCancel">Cancelar</button>
                </div>
              </form>
            </div>
          </section>

          <!-- DATOS -->
          <section class="account-tab ${tab === "datos" ? "is-active" : ""}" id="tab-datos">
            <div class="box">
              <h2>Datos personales</h2>
              <div class="form-alert" id="profileMsg"></div>
              <div class="form-grid">
                <div class="field"><label>Nombre</label><input id="pName" value="${user.name}"></div>
                <div class="field"><label>Teléfono</label><input id="pPhone" value="${user.phone || ""}" placeholder="+34 600 000 000"></div>
                <div class="field field--full"><label>Email (no editable)</label><input value="${session.email}" disabled style="background:var(--bg);color:var(--ink-soft)"></div>
              </div>
              <button class="btn btn--primary btn--sm" id="saveProfile" style="margin-top:14px">Guardar cambios</button>
            </div>
            <div class="box">
              <h2>Cambiar contraseña</h2>
              <div class="form-alert" id="passMsg"></div>
              <div class="form-grid">
                <div class="field field--full"><label>Contraseña actual</label><input id="oldPass" type="password"></div>
                <div class="field"><label>Nueva contraseña</label><input id="newPass" type="password"></div>
                <div class="field"><label>Repite la nueva</label><input id="newPass2" type="password"></div>
              </div>
              <button class="btn btn--outline btn--sm" id="savePass" style="margin-top:14px">Actualizar contraseña</button>
            </div>
          </section>
        </div>
      </div>`;

    bind();
  }

  function bind() {
    document.querySelectorAll("[data-tab]").forEach((b) =>
      b.addEventListener("click", () => {
        tab = b.dataset.tab; detailOrder = null;
        history.replaceState(null, "", "#" + tab);
        render();
      })
    );
    document.querySelectorAll("[data-goto-tab]").forEach((a) =>
      a.addEventListener("click", () => { tab = a.dataset.gotoTab; detailOrder = null; history.replaceState(null, "", "#" + tab); render(); })
    );
    document.getElementById("logoutSide").addEventListener("click", () => {
      AAO_AUTH.logout();
      window.location.href = "index.html";
    });

    /* Detalle de pedido */
    document.querySelectorAll("[data-detail]").forEach((b) =>
      b.addEventListener("click", () => {
        detailOrder = orders.find((o) => o.id === b.dataset.detail);
        tab = "pedidos";
        render();
      })
    );
    const back = document.getElementById("backOrders");
    if (back) back.addEventListener("click", () => { detailOrder = null; render(); });

    /* Direcciones */
    const addrForm = document.getElementById("addrForm");
    if (addrForm) {
      document.getElementById("addrNew").addEventListener("click", () => { addrForm.style.display = "grid"; });
      document.getElementById("addrCancel").addEventListener("click", () => { addrForm.style.display = "none"; });
      addrForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(addrForm).entries());
        if (Object.values(data).some((v) => !String(v).trim())) return;
        AAO_AUTH.saveAddress(session.email, data);
        addresses = AAO_AUTH.getAddresses(session.email);
        AAO.aaoToast("Dirección guardada");
        render();
      });
      document.querySelectorAll("[data-addr-del]").forEach((b) =>
        b.addEventListener("click", () => {
          AAO_AUTH.deleteAddress(session.email, Number(b.dataset.addrDel));
          addresses = AAO_AUTH.getAddresses(session.email);
          AAO.aaoToast("Dirección eliminada");
          render();
        })
      );
    }

    /* Perfil */
    const saveProfile = document.getElementById("saveProfile");
    if (saveProfile) saveProfile.addEventListener("click", () => {
      const msg = document.getElementById("profileMsg");
      AAO_AUTH.updateProfile(session.email, { name: document.getElementById("pName").value, phone: document.getElementById("pPhone").value });
      msg.textContent = "Datos actualizados correctamente.";
      msg.style.cssText = "display:block;background:var(--green-soft);border-color:#BBE5C8;color:var(--green)";
      AAO.aaoToast("Perfil actualizado");
    });
    const savePass = document.getElementById("savePass");
    if (savePass) savePass.addEventListener("click", () => {
      const msg = document.getElementById("passMsg");
      const n1 = document.getElementById("newPass").value, n2 = document.getElementById("newPass2").value;
      if (n1 !== n2) { msg.textContent = "Las contraseñas nuevas no coinciden."; msg.classList.add("is-show"); return; }
      const res = AAO_AUTH.changePassword(session.email, document.getElementById("oldPass").value, n1);
      if (!res.ok) { msg.textContent = res.error; msg.classList.add("is-show"); return; }
      msg.classList.remove("is-show");
      AAO.aaoToast("Contraseña actualizada");
      document.getElementById("oldPass").value = document.getElementById("newPass").value = document.getElementById("newPass2").value = "";
    });
  }

  $("#searchForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const q = $("#searchInput").value.trim();
    if (q) window.location.href = "buscar.html?q=" + encodeURIComponent(q);
  });

  render();
  AAO.syncCartBadge();
  AAO.aaoCountdown();
})();
