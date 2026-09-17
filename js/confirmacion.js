/* ═══════════════════════════════════════════════════════════
   ALL AT ONCE — Confirmación de pedido (confirmacion.html)
   ═══════════════════════════════════════════════════════════ */

"use strict";

(function () {
  const $ = (sel) => document.querySelector(sel);
  const root = $("#confirmRoot");
  const id = new URLSearchParams(location.search).get("orden");
  const order = AAO_AUTH.getOrders().find((o) => o.id === id);

  if (!order) {
    root.innerHTML = `
      <div class="confirm">
        <h1>No encontramos ese pedido</h1>
        <p>Comprueba el enlace o entra en tu cuenta para ver tus pedidos.</p>
        <div class="confirm__cta"><a class="btn btn--primary btn--lg" href="index.html">Volver a la tienda</a></div>
      </div>`;
    return;
  }

  const fecha = new Date(order.fecha).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const eta = new Date(order.fecha);
  eta.setDate(eta.getDate() + (order.envio > 5 ? 1 : 4));
  const etaStr = eta.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });

  document.title = `Pedido ${order.id} confirmado · All At Once`;

  root.innerHTML = `
    <div class="confirm">
      <span class="confirm__icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
      </span>
      <h1>¡Gracias por tu pedido!</h1>
      <p>Hemos recibido tu compra correctamente. Te hemos enviado la confirmación a <strong>${order.cliente}</strong>.</p>
      <p class="confirm__order">Pedido ${order.id}</p>
      <p>Realizado el ${fecha} · Entrega estimada: <strong style="color:var(--green)">${etaStr}</strong> · Seguimiento: <strong>${order.tracking}</strong></p>

      <div class="box" style="max-width:560px;margin:30px auto 0;text-align:left">
        <h2>Tu pedido</h2>
        ${order.items.map((it) => `
          <div class="review-line">
            <span><strong>${it.qty} ×</strong> ${it.nombre}</span>
            <span class="num">${AAO.fmt.format(it.precio * it.qty)}</span>
          </div>`).join("")}
        ${order.descuento ? `<div class="review-line" style="color:var(--green)"><span>Descuento (${order.cupon})</span><span class="num">−${AAO.fmt.format(order.descuento)}</span></div>` : ""}
        <div class="review-line"><span>Envío</span><span class="num">${order.envio === 0 ? "Gratis" : AAO.fmt.format(order.envio)}</span></div>
        <div class="review-line" style="border:none"><span><strong>Total (${order.pago})</strong></span><strong class="num" style="font-size:1.1rem">${AAO.fmt.format(order.total)}</strong></div>
      </div>

      <div class="confirm__cta">
        <a class="btn btn--primary btn--lg" href="index.html">Seguir comprando</a>
        <a class="btn btn--outline btn--lg" href="cuenta.html#pedidos">Ver mis pedidos</a>
      </div>
    </div>`;
})();
