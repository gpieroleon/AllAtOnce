/* ═══════════════════════════════════════════════════════════
   ALL AT ONCE — Checkout en 3 pasos (checkout.html)
   1) Datos de envío · 2) Envío y pago · 3) Revisión y confirmación
   Guest checkout permitido. Referencia: sección 2.4 del doc.
   ═══════════════════════════════════════════════════════════ */

"use strict";

(function () {
  const $ = (sel) => document.querySelector(sel);
  const root = $("#checkoutRoot");

  /* Cesta vacía → volver al carrito */
  const initialCart = AAO.CartStore.load();
  if (initialCart.size === 0) {
    root.innerHTML = `
      <div class="box" style="text-align:center;padding:52px 24px;margin-top:30px">
        <p style="font-family:var(--font-display);font-size:1.3rem;font-weight:700">No hay nada que tramitar</p>
        <p style="color:var(--ink-soft);margin:8px 0 22px">Tu cesta está vacía. Añade productos para continuar.</p>
        <a class="btn btn--primary btn--lg" href="index.html">Volver a la tienda</a>
      </div>`;
    return;
  }

  const session = AAO_AUTH.session();
  const savedAddrs = session ? AAO_AUTH.getAddresses(session.email) : [];

  const state = {
    step: 1,
    shipping: "estandar",
    payment: "tarjeta",
    terms: false,
    form: {
      nombre: session ? session.name : "",
      email: session ? session.email : "",
      telefono: session && AAO_AUTH.find(session.email) ? AAO_AUTH.find(session.email).phone || "" : "",
      direccion: "", ciudad: "", provincia: "", cp: "", pais: "España",
      tarjeta: "", caducidad: "", cvv: "",
    },
  };

  function totals() {
    const cart = AAO.CartStore.load();
    const items = [...cart.entries()].map(([id, qty]) => ({ p: AAO.byId(id), qty })).filter((x) => x.p);
    const subtotal = items.reduce((s, x) => s + x.p.price * x.qty, 0);
    const code = localStorage.getItem("aao_coupon") || "";
    const coupon = code ? AAO.couponDiscount(code, subtotal) : null;
    const discount = coupon ? coupon.amount : 0;
    const method = AAO.shippingMethods().find((m) => m.id === state.shipping) || AAO.shippingMethods()[0];
    let shipping = 0;
    if (method) {
      shipping = (method.gratisDesde != null && subtotal - discount >= method.gratisDesde) ? 0 : method.precio;
      shipping += method.extra || 0;
    }
    const total = subtotal - discount + shipping;
    return { items, subtotal, coupon, discount, shipping, total, method };
  }

  function stepperHTML() {
    const steps = ["Envío", "Pago", "Revisión"];
    return `<div class="stepper">${steps.map((s, i) => {
      const n = i + 1;
      const cls = n < state.step ? "is-done" : n === state.step ? "is-active" : "";
      return `<div class="stepper__step ${cls}">
        <span class="stepper__dot">${n < state.step ? "✓" : n}</span>
        <span class="stepper__label">${s}</span>
      </div>${n < 3 ? '<span class="stepper__bar"></span>' : ""}`;
    }).join("")}</div>`;
  }

  const field = (key, label, type = "text", opts = {}) => `
    <div class="field ${opts.full ? "field--full" : ""}" data-field="${key}">
      <label for="f-${key}">${label}</label>
      <input id="f-${key}" type="${type}" value="${state.form[key] || ""}" placeholder="${opts.ph || ""}" ${opts.attrs || ""}>
      <span class="field-err">${opts.err || "Campo obligatorio"}</span>
    </div>`;

  function render() {
    const t = totals();

    /* ── PASO 1: Datos de envío ── */
    if (state.step === 1) {
      root.innerHTML = `
        <div class="page-head"><h1>Tramitar pedido</h1><p>Puedes comprar como invitado o <a href="login.html?from=checkout.html" style="color:var(--accent);font-weight:600">iniciar sesión</a>.</p></div>
        ${stepperHTML()}
        <div class="box">
          <h2>Datos de envío</h2>
          ${savedAddrs.length ? `
            <div class="field" style="margin-bottom:14px">
              <label for="f-savedaddr">Usar una dirección guardada</label>
              <select id="f-savedaddr">
                <option value="">— Elegir —</option>
                ${savedAddrs.map((a, i) => `<option value="${i}">${a.nombre} · ${a.direccion}, ${a.ciudad}</option>`).join("")}
              </select>
            </div>` : ""}
          <div class="form-alert" id="formAlert"></div>
          <div class="form-grid">
            ${field("nombre", "Nombre completo", "text", { full: true, err: "Introduce tu nombre" })}
            ${field("email", "Email", "email", { err: "Introduce un email válido" })}
            ${field("telefono", "Teléfono", "tel", { err: "Introduce un teléfono" })}
            ${field("direccion", "Dirección (calle y número)", "text", { full: true, err: "Introduce la dirección" })}
            ${field("ciudad", "Ciudad", "text", { err: "Introduce la ciudad" })}
            ${field("provincia", "Provincia", "text", { err: "Introduce la provincia" })}
            ${field("cp", "Código postal", "text", { attrs: 'maxlength="5" inputmode="numeric"', err: "CP de 5 dígitos" })}
            <div class="field" data-field="pais">
              <label for="f-pais">País</label>
              <select id="f-pais">${["España", "Italia", "Francia", "Portugal", "Alemania"].map((c) => `<option ${state.form.pais === c ? "selected" : ""}>${c}</option>`).join("")}</select>
            </div>
          </div>
          <button class="btn btn--primary btn--lg" id="toStep2" style="margin-top:20px">Continuar al pago</button>
        </div>`;

      const savedSel = $("#f-savedaddr");
      if (savedSel) savedSel.addEventListener("change", () => {
        const a = savedAddrs[Number(savedSel.value)];
        if (!a) return;
        ["nombre", "direccion", "ciudad", "provincia", "cp", "telefono"].forEach((k) => {
          state.form[k] = a[k] || state.form[k];
        });
        render();
      });

      $("#toStep2").addEventListener("click", () => {
        let ok = true;
        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        Object.keys(state.form).forEach((k) => {
          if (["tarjeta", "caducidad", "cvv"].includes(k)) return;
          const input = $(`#f-${k}`);
          if (!input) return;
          state.form[k] = input.value.trim();
          let valid = state.form[k].length >= 2;
          if (k === "email") valid = emailRe.test(state.form[k]);
          if (k === "cp") valid = /^\d{5}$/.test(state.form[k]);
          input.closest(".field").classList.toggle("has-error", !valid);
          input.classList.toggle("is-error", !valid);
          if (!valid) ok = false;
        });
        if (!ok) { $("#formAlert").textContent = "Revisa los campos marcados en rojo."; $("#formAlert").classList.add("is-show"); return; }
        state.step = 2;
        render();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }

    /* ── PASO 2: Envío y pago ── */
    if (state.step === 2) {
      root.innerHTML = `
        <div class="page-head"><h1>Tramitar pedido</h1></div>
        ${stepperHTML()}
        <div class="box">
          <h2>Método de envío</h2>
          ${AAO.shippingMethods().filter((m) => m.activo).map((m) => {
            const free = m.gratisDesde != null && t.subtotal - t.discount >= m.gratisDesde;
            const price = (free ? 0 : m.precio) + (m.extra || 0);
            return `
            <label class="shipopt ${state.shipping === m.id ? "is-active" : ""}">
              <input type="radio" name="ship" value="${m.id}" ${state.shipping === m.id ? "checked" : ""}>
              <div><strong>${m.nombre}</strong><small>${m.desc}</small></div>
              <span class="payopt__price">${price === 0 ? "Gratis" : AAO.fmt.format(price)}</span>
            </label>`;
          }).join("")}

          <h2 style="margin-top:22px">Método de pago</h2>
          ${AAO.paymentMethods().filter((m) => m.activo).map((m) => `
            <label class="payopt ${state.payment === m.id ? "is-active" : ""}">
              <input type="radio" name="pay" value="${m.id}" ${state.payment === m.id ? "checked" : ""}>
              <div><strong>${m.nombre}</strong><small>${m.desc}</small></div>
            </label>
            ${m.id === "tarjeta" && state.payment === "tarjeta" ? `
            <div class="card-fields form-grid">
              ${field("tarjeta", "Número de tarjeta", "text", { full: true, ph: "1234 5678 9012 3456", attrs: 'maxlength="19" inputmode="numeric"', err: "16 dígitos" })}
              ${field("caducidad", "Caducidad", "text", { ph: "MM/AA", attrs: 'maxlength="5"', err: "Formato MM/AA" })}
              ${field("cvv", "CVV", "text", { ph: "123", attrs: 'maxlength="4" inputmode="numeric"', err: "3–4 dígitos" })}
            </div>` : ""}`).join("")}

          <div class="form-alert" id="formAlert"></div>
          <div style="display:flex;gap:12px;margin-top:20px;flex-wrap:wrap">
            <button class="btn btn--outline" id="back1">‹ Volver</button>
            <button class="btn btn--primary btn--lg" id="toStep3">Revisar pedido</button>
          </div>
        </div>`;

      document.querySelectorAll('input[name="ship"]').forEach((r) =>
        r.addEventListener("change", () => { state.shipping = r.value; render(); })
      );
      document.querySelectorAll('input[name="pay"]').forEach((r) =>
        r.addEventListener("change", () => { state.payment = r.value; render(); })
      );
      $("#back1").addEventListener("click", () => { state.step = 1; render(); });
      $("#toStep3").addEventListener("click", () => {
        if (state.payment === "tarjeta") {
          let ok = true;
          const num = $("#f-tarjeta").value.replace(/\s/g, "");
          const checks = [
            ["tarjeta", num.length === 16, "Número de tarjeta de 16 dígitos."],
            ["caducidad", /^\d{2}\/\d{2}$/.test($("#f-caducidad").value), "Caducidad en formato MM/AA."],
            ["cvv", /^\d{3,4}$/.test($("#f-cvv").value), "CVV de 3–4 dígitos."],
          ];
          checks.forEach(([k, valid, msg]) => {
            const input = $(`#f-${k}`);
            if (input) {
              state.form[k] = input.value.trim();
              input.closest(".field").classList.toggle("has-error", !valid);
              if (!valid) { ok = false; $("#formAlert").textContent = msg; }
            }
          });
          if (!ok) { $("#formAlert").classList.add("is-show"); return; }
        }
        state.step = 3;
        render();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }

    /* ── PASO 3: Revisión y confirmación ── */
    if (state.step === 3) {
      const payMethod = AAO.paymentMethods().find((m) => m.id === state.payment);
      const payLabel = payMethod ? payMethod.nombre : state.payment;
      const shipLabel = t.method ? `${t.method.nombre}` : state.shipping;
      const eta = new Date();
      eta.setDate(eta.getDate() + (t.method ? t.method.dias : 4));
      const etaStr = eta.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });

      root.innerHTML = `
        <div class="page-head"><h1>Tramitar pedido</h1></div>
        ${stepperHTML()}
        <div class="box">
          <h2>Revisa tu pedido</h2>
          ${t.items.map(({ p, qty }) => `
            <div class="review-line">
              <span><strong>${qty} ×</strong> ${p.name}</span>
              <span class="num">${AAO.fmt.format(p.price * qty)}</span>
            </div>`).join("")}
          <div class="review-line"><span>Subtotal</span><span class="num">${AAO.fmt.format(t.subtotal)}</span></div>
          ${t.discount ? `<div class="review-line" style="color:var(--green)"><span>Descuento (${t.coupon.code})</span><span class="num">−${AAO.fmt.format(t.discount)}</span></div>` : ""}
          <div class="review-line"><span>Envío · ${shipLabel}</span><span class="num">${t.shipping === 0 ? "Gratis" : AAO.fmt.format(t.shipping)}</span></div>
          <div class="review-line" style="border:none"><span><strong>Total</strong></span><strong class="num" style="font-size:1.15rem">${AAO.fmt.format(t.total)}</strong></div>

          <h2 style="margin-top:22px">Envío a</h2>
          <p style="font-size:.9rem;color:var(--ink-soft);line-height:1.7">
            <strong style="color:var(--ink)">${state.form.nombre}</strong><br>
            ${state.form.direccion}<br>${state.form.cp} ${state.form.ciudad} (${state.form.provincia}), ${state.form.pais}<br>
            ${state.form.email} · ${state.form.telefono}
          </p>
          <p style="font-size:.85rem;color:var(--ink-soft)">Entrega estimada: <strong style="color:var(--green)">${etaStr}</strong> · Pago: ${payLabel}</p>

          <label class="terms">
            <input type="checkbox" id="terms">
            <span>He leído y acepto las <a href="politicas.html" style="color:var(--accent)">Condiciones de compra</a> y la Política de privacidad de All At Once.</span>
          </label>
          <div class="form-alert" id="formAlert"></div>
          <div style="display:flex;gap:12px;flex-wrap:wrap">
            <button class="btn btn--outline" id="back2">‹ Volver</button>
            <button class="btn btn--buy btn--lg" id="placeOrder">Confirmar pedido · ${AAO.fmt.format(t.total)}</button>
          </div>
        </div>`;

      $("#back2").addEventListener("click", () => { state.step = 2; render(); });
      $("#placeOrder").addEventListener("click", () => {
        if (!$("#terms").checked) {
          $("#formAlert").textContent = "Debes aceptar las condiciones de compra para continuar.";
          $("#formAlert").classList.add("is-show");
          return;
        }
        const order = {
          id: "AAO-" + Date.now().toString(36).toUpperCase().slice(-6),
          fecha: new Date().toISOString(),
          cliente: state.form.email,
          nombreCliente: state.form.nombre,
          items: t.items.map(({ p, qty }) => ({ id: p.id, nombre: p.name, qty, precio: p.price, img: p.img, g: p.g, icon: p.icon })),
          subtotal: t.subtotal,
          descuento: t.discount,
          cupon: t.coupon ? t.coupon.code : null,
          envio: t.shipping,
          total: t.total,
          direccion: { ...state.form },
          pago: payLabel,
          estado: state.payment === "reembolso" ? "Pendiente de pago" : "Pagado",
          tracking: "PK" + Math.random().toString(36).slice(2, 10).toUpperCase(),
        };
        AAO_AUTH.placeOrder(order);
        AAO.CartStore.save(new Map());
        localStorage.removeItem("aao_coupon");
        window.location.href = "confirmacion.html?orden=" + order.id;
      });
    }
  }

  render();
})();
