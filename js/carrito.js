/* ═══════════════════════════════════════════════════════════
   ALL AT ONCE — Página de cesta (carrito.html)
   Edición de cantidades, cupones, totales con IVA y paso
   al checkout. Referencia: sección 2.3 de la especificación.
   ═══════════════════════════════════════════════════════════ */

"use strict";

(function () {
  const $ = (sel) => document.querySelector(sel);
  const root = $("#cartRoot");

  function totals() {
    const cart = AAO.CartStore.load();
    const items = [...cart.entries()].map(([id, qty]) => ({ p: AAO.byId(id), qty })).filter((x) => x.p);
    const subtotal = items.reduce((s, x) => s + x.p.price * x.qty, 0);
    const code = localStorage.getItem("aao_coupon") || "";
    const coupon = code ? AAO.couponDiscount(code, subtotal) : null;
    const discount = coupon ? coupon.amount : 0;
    const shipping = items.length === 0 ? 0 : subtotal - discount >= AAO.FREE_SHIP ? 0 : AAO.SHIP_COST;
    const total = subtotal - discount + shipping;
    const iva = total - total / (1 + AAO.IVA);
    return { cart, items, subtotal, coupon, discount, shipping, total, iva, code };
  }

  function render() {
    const t = totals();
    const n = t.items.reduce((s, x) => s + x.qty, 0);
    $("#cartSub").textContent = n ? `${n} artículo${n > 1 ? "s" : ""} en tu cesta` : "";
    AAO.syncCartBadge();

    if (t.items.length === 0) {
      root.innerHTML = `
        <div class="box" style="text-align:center;padding:52px 24px">
          <p style="font-family:var(--font-display);font-size:1.3rem;font-weight:700">Tu cesta está vacía</p>
          <p style="color:var(--ink-soft);margin:8px 0 22px">Descubre ofertas flash, novedades y lo más vendido.</p>
          <a class="btn btn--primary btn--lg" href="categoria.html?cat=ofertas">Explorar ofertas</a>
        </div>`;
      return;
    }

    root.innerHTML = `
      <div class="cart-layout">
        <div class="box">
          ${t.items.map(({ p, qty }) => `
            <div class="cart-item">
              <a class="cart-item__media" href="producto.html?id=${p.id}" style="background:linear-gradient(140deg, ${p.g[0]}, ${p.g[1]})">
                ${AAO.icon(p.icon)}
                <img src="${p.img}" alt="${p.name}" onerror="this.remove()">
              </a>
              <div>
                <a class="cart-item__name" href="producto.html?id=${p.id}">${p.name}</a>
                <p class="cart-item__variant">${AAO.fmt.format(p.price)} / unidad · ${p.prime ? "Envío exprés 24 h" : "Envío estándar"}</p>
                <div class="cart-item__actions">
                  <div class="citem__qty">
                    <button data-qty="-1" data-id="${p.id}" aria-label="Quitar uno">−</button>
                    <span>${qty}</span>
                    <button data-qty="1" data-id="${p.id}" aria-label="Añadir uno">+</button>
                  </div>
                  <button class="link-btn" data-fav="${p.id}">Mover a favoritos</button>
                  <button class="link-btn" data-del="${p.id}" style="color:#B91C1C">Eliminar</button>
                </div>
              </div>
              <div class="cart-item__right">
                <span class="cart-item__price">${AAO.fmt.format(p.price * qty)}</span>
              </div>
            </div>`).join("")}
        </div>

        <aside class="box" style="position:sticky;top:96px">
          <h2>Resumen</h2>
          <div class="coupon">
            <input id="couponInput" placeholder="Código de cupón" value="${t.code}">
            <button class="btn btn--outline btn--sm" id="couponBtn">Aplicar</button>
          </div>
          ${t.coupon ? `<div class="coupon-ok"><span>Cupón ${t.coupon.code} aplicado (${t.coupon.descripcion})</span><button class="link-btn" id="couponRemove">Quitar</button></div>` : ""}
          <div id="couponMsg" class="form-alert" style="margin-top:10px"></div>
          <div style="margin-top:16px">
            <div class="summary-row"><span>Subtotal</span><span class="num">${AAO.fmt.format(t.subtotal)}</span></div>
            ${t.discount ? `<div class="summary-row" style="color:var(--green)"><span>Descuento (${t.code})</span><span class="num">−${AAO.fmt.format(t.discount)}</span></div>` : ""}
            <div class="summary-row"><span>Envío (estándar)</span><span class="num">${t.shipping === 0 ? '<span class="free">Gratis</span>' : AAO.fmt.format(t.shipping)}</span></div>
            <div class="summary-row--total summary-row"><span>Total</span><strong class="num">${AAO.fmt.format(t.total)}</strong></div>
            <p class="summary-note">IVA incluido (21%): ${AAO.fmt.format(t.iva)} · Envío gratis en pedidos desde ${AAO.fmt.format(AAO.FREE_SHIP)}</p>
          </div>
          <a class="btn btn--primary btn--block btn--lg" href="checkout.html" style="margin-top:16px">Proceder al pago</a>
          <a class="btn btn--outline btn--block" href="index.html" style="margin-top:10px">Continuar comprando</a>
        </aside>
      </div>`;
  }

  root.addEventListener("click", (e) => {
    const qtyBtn = e.target.closest("[data-qty]");
    if (qtyBtn) {
      const cart = AAO.CartStore.load();
      const id = Number(qtyBtn.dataset.id);
      const q = (cart.get(id) || 0) + Number(qtyBtn.dataset.qty);
      if (q <= 0) cart.delete(id); else cart.set(id, q);
      AAO.CartStore.save(cart);
      render();
      return;
    }
    const delBtn = e.target.closest("[data-del]");
    if (delBtn) {
      const cart = AAO.CartStore.load();
      cart.delete(Number(delBtn.dataset.del));
      AAO.CartStore.save(cart);
      AAO.aaoToast("Artículo eliminado de la cesta");
      render();
      return;
    }
    const favBtn = e.target.closest("[data-fav]");
    if (favBtn) {
      const favs = new Set(JSON.parse(localStorage.getItem("aao_wishlist") || "[]"));
      favs.add(Number(favBtn.dataset.fav));
      localStorage.setItem("aao_wishlist", JSON.stringify([...favs]));
      const cart = AAO.CartStore.load();
      cart.delete(Number(favBtn.dataset.fav));
      AAO.CartStore.save(cart);
      AAO.aaoToast("Movido a favoritos");
      render();
      return;
    }
    if (e.target.closest("#couponBtn")) {
      const code = $("#couponInput").value.trim();
      const msg = $("#couponMsg");
      const t = totals();
      const c = code ? AAO.couponDiscount(code, t.subtotal) : null;
      if (!code) { msg.textContent = "Introduce un código de cupón."; msg.classList.add("is-show"); return; }
      if (!c) { msg.textContent = "El cupón no es válido o ha caducado."; msg.classList.add("is-show"); return; }
      localStorage.setItem("aao_coupon", c.code);
      msg.classList.remove("is-show");
      AAO.aaoToast(`Cupón ${c.code} aplicado`);
      render();
      return;
    }
    if (e.target.closest("#couponRemove")) {
      localStorage.removeItem("aao_coupon");
      render();
    }
  });

  $("#searchForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const q = $("#searchInput").value.trim();
    if (q) window.location.href = "buscar.html?q=" + encodeURIComponent(q);
  });
  $("#burger").addEventListener("click", () => {
    $("#burger").classList.toggle("is-open");
    $("#catnav").classList.toggle("is-open");
  });

  render();
  AAO.aaoCountdown();
})();
