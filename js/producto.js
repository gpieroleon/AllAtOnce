/* ═══════════════════════════════════════════════════════════
   ALL AT ONCE — Ficha de producto (producto.html)
   Galería con zoom, caja de compra, detalles, opiniones de
   clientes con histograma y relacionados. Referencia: amazon.com
   ═══════════════════════════════════════════════════════════ */

"use strict";

(function () {
  const $ = (sel) => document.querySelector(sel);
  const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

  const id = Number(new URLSearchParams(location.search).get("id"));
  const p = AAO.byId(id);
  const root = $("#pdRoot");

  /* ── Producto no encontrado ── */
  if (!p) {
    document.title = "Producto no encontrado · All At Once";
    root.innerHTML = `
      <div class="pd__missing">
        <h1>No encontramos este producto</h1>
        <p>Puede que ya no esté disponible o que el enlace sea incorrecto.</p>
        <a class="btn btn--primary btn--lg" href="index.html">Volver a la tienda</a>
      </div>`;
    return;
  }

  document.title = `${p.name} · All At Once`;

  /* ── Reviews deterministas (generador central en catalog.js, con moderación del admin) ── */
  function rng(seed) {
    let a = (seed * 2654435761) >>> 0;
    return () => ((a = (a * 1664525 + 1013904223) >>> 0) / 4294967296);
  }

  /* ── Descripción y ficha técnica por producto ── */
  const DESCRIPTIONS = {
    1: "Los auriculares Nova X de Nova Audio combinan cancelación de ruido híbrida, drivers de 40 mm y una autonomía de hasta 24 horas. Su diadema plegable y las almohadillas viscoelásticas los hacen perfectos para desplazamientos, oficina o viajes largos.",
    2: "El Smartwatch Fit Pro de FitTech monitoriza ritmo cardíaco, sueño y más de 100 modos deportivos con GPS integrado. Pantalla AMOLED de 1,4\", resistencia al agua 5 ATM y una batería que darga una semana completa.",
    3: "El altavoz Pulse Boom llena cualquier estancia con 30 W de potencia y graves profundos gracias a su radiador pasivo. Resistente al agua IPX7, es el compañero ideal para casa, terraza o escapadas.",
    4: "Las Velocity Runner de Velocity están diseñadas para corredores que buscan ligereza y retorno de energía. Su media suela de espuma EVA y la malla técnica transpirable te acompañan del primer al último kilómetro.",
    5: "La chaqueta North Wind protege del viento y la lluvia ligera con su membrana impermeable y tejido reciclado. Cortavientos versátil con capucha ajustable y bolsillos interiores, pensada para el día a día urbano.",
    6: "La mochila Urban Flex de 22 L está fabricada en nylon balístico 900D con cremalleras YKK: resistente al agua, al roce y a la vida en movimiento. Compartimento acolchado para portátil de hasta 15,6\".",
    7: "Las gafas Riviera de Riviera Eyewear combinan acetato italiano y cristales polarizados con protección UV400. Un diseño atemporal de inspiración retro que protege con estilo durante todo el año.",
    8: "El Minimal Steel de Minimal Steel Co. es un reloj de caja de 40 mm en acero inoxidable 316L con cristal de zafiro. Movimiento japonés, resistencia 5 ATM y una estética minimalista que combina con todo.",
    9: "La lámpara Luna Desk de Luna Living crea una luz cálida y regulable con su brazo articulado de 360°. Su difusor antideslumbrante cuida la vista durante largas jornadas de lectura o trabajo.",
    10: "El set Atelier de Atelier Cerámica incluye cuatro piezas de gres esmaltado hechas a mano: dos tazas de 350 ml y dos platos de postre. Cada pieza es única, con pequeñas variaciones que celebran lo artesanal.",
    11: "El Kit Skincare Glow de Glow Lab reúne limpiador, sérum y crema hidratante con un 92% de ingredientes de origen natural. Una rutina completa de tres pasos para una piel luminosa en dos semanas.",
    12: "Nocturne es una eau de parfum con un 18% de concentración: notas de bergamota y cardamomo se abren hacia un corazón de jazmín y un fondo amaderado de sándalo y vainilla. Intensidad que dura más de 8 horas.",
  };

  const SPECS = {
    1: { Marca: "Nova Audio", Material: "ABS mate · almohadillas viscoelásticas", Dimensiones: "18 × 16 × 8 cm", Peso: "248 g", Color: "Negro grafito", Conectividad: "Bluetooth 5.3 · Jack 3,5 mm", Garantía: "2 años", "Referencia AAO": "AAO-HPX-001" },
    2: { Marca: "FitTech", Material: "Aluminio · correa de fluoroelastómero", Dimensiones: "4,6 × 3,8 × 1,1 cm (caja)", Peso: "52 g", Color: "Negro / plata", Pantalla: 'AMOLED 1,4" táctil', Garantía: "2 años", "Referencia AAO": "AAO-SMW-002" },
    3: { Marca: "Pulse Sound", Material: "Tela técnica · carcasa rígida", Dimensiones: "18 × 7 × 7 cm", Peso: "620 g", Color: "Azul océano", Conectividad: "Bluetooth 5.3 · AUX", Garantía: "2 años", "Referencia AAO": "AAO-SP3-003" },
    4: { Marca: "Velocity", Material: "Malla técnica · suela de goma EVA", Dimensiones: "30 × 18 × 12 cm (caja)", Peso: "640 g (par)", Color: "Rojo coral", Tallas: "EU 36–46", Garantía: "2 años (legal)", "Referencia AAO": "AAO-ZPV-004" },
    5: { Marca: "North Wind", Material: "Poliéster reciclado · membrana impermeable", Dimensiones: "70 cm de largo (talla M)", Peso: "780 g (talla M)", Color: "Verde bosque", Tallas: "S – XXL", Garantía: "2 años (legal)", "Referencia AAO": "AAO-CHN-005" },
    6: { Marca: "Urban Flex", Material: "Nylon balístico 900D · cremalleras YKK", Dimensiones: "45 × 30 × 15 cm (22 L)", Peso: "890 g", Color: "Arena", Compartimentos: "Portátil 15,6\" + 5 bolsillos", Garantía: "2 años", "Referencia AAO": "AAO-MBU-006" },
    7: { Marca: "Riviera Eyewear", Material: "Acetato italiano · cristal polarizado", Dimensiones: "14,5 × 5 × 14 cm", Peso: "28 g", Color: "Carey dorado", Protección: "UV400 · categoría 3", Garantía: "2 años", "Referencia AAO": "AAO-GFR-007" },
    8: { Marca: "Minimal Steel Co.", Material: "Acero inoxidable 316L · cristal de zafiro", Dimensiones: "Caja de 40 mm · correa 20 mm", Peso: "120 g", Color: "Plateado", Resistencia: "5 ATM (50 m)", Garantía: "2 años", "Referencia AAO": "AAO-RWM-008" },
    9: { Marca: "Luna Living", Material: "Metal lacado · difusor de policarbonato", Dimensiones: "28 × 18 × 38 cm", Peso: "1,4 kg", Color: "Blanco luna", Bombilla: "LED 9 W incluida (E27)", Garantía: "2 años", "Referencia AAO": "AAO-LPL-009" },
    10: { Marca: "Atelier Cerámica", Material: "Gres esmaltado artesanal", Dimensiones: "Taza: 8 × 9 cm (350 ml)", Peso: "1,2 kg (set completo)", Color: "Blanco roto", Cuidados: "Apto lavavajillas y microondas", Garantía: "2 años", "Referencia AAO": "AAO-CMA-010" },
    11: { Marca: "Glow Lab", Material: "Fórmula vegana · 92% origen natural", Dimensiones: "3 × 50 ml", Peso: "420 g", Color: "—", Apto_para: "Todo tipo de pieles · testado dermatológicamente", Garantía: "2 años", "Referencia AAO": "AAO-SKG-011" },
    12: { Marca: "Nocturne Parfums", Material: "Eau de parfum · 18% concentración", Dimensiones: "5 × 5 × 11 cm (50 ml)", Peso: "320 g", Color: "Ámbar oscuro", Familia_olfativa: "Amaderada aromática", Garantía: "2 años", "Referencia AAO": "AAO-PFN-012" },
  };

  const FEATURES = {
    Tech: ["Batería de larga duración: hasta 24 h de uso continuo", "Conexión estable Bluetooth 5.3 con emparejamiento instantáneo", "Diseño compacto y ligero, fácil de llevar a todas partes", "Compatible con iOS, Android, Windows y macOS", "Carga rápida: 15 minutos equivalen a 3 h de uso", "Materiales premium con acabado mate resistente a huellas"],
    Moda: ["Tejido transpirable de alta resistencia", "Corte moderno unisex, tallas de la S a la XXL", "Costuras reforzadas para el uso diario", "Fácil cuidado: apto para lavadora", "Colores que no destiñen tras múltiples lavados", "Diseño ligero pensado para moverte con libertad"],
    Hogar: ["Materiales naturales y acabado artesanal", "Base estable antideslizante", "Fácil limpieza con un paño húmedo", "Diseño atemporal que combina con cualquier estancia", "Fabricado con procesos sostenibles", "Resistente al calor y a la humedad"],
    Belleza: ["Fórmula dermatológicamente testada", "Ingredientes de origen natural al 92%", "Apto para pieles sensibles", "Sin parabenos ni siliconas", "Envase 100% reciclable", "Resultados visibles desde la primera semana"],
    Accesorios: ["Acero inoxidable y materiales hipoalergénicos", "Acabado pulido resistente a arañazos", "Diseño minimalista atemporal", "Ajuste cómodo para uso prolongado", "Incluye estuche de protección", "Resistente al agua y al sudor"],
  };

  function featuresFor(prod) {
    const pool = FEATURES[prod.cat];
    const r = rng(prod.id * 31 + 7);
    const idx = new Set();
    while (idx.size < 4) idx.add(Math.floor(r() * pool.length));
    return [...idx].map((i) => pool[i]);
  }

  function deliveryDate(prod) {
    const d = new Date();
    d.setDate(d.getDate() + (prod.prime ? 1 : 3));
    return d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
  }

  const reviews = AAO.reviewsFor(p);
  const feats = featuresFor(p);
  const gallery = (Array.isArray(p.imagenes) && p.imagenes.length ? p.imagenes : [p.img]).filter(Boolean);
  const variants = Array.isArray(p.variantes) ? p.variantes.filter((vr) => vr && (vr.talla || vr.color)) : [];
  const tallas = [...new Set(variants.map((vr) => vr.talla).filter(Boolean))];
  const colores = [...new Set(variants.map((vr) => vr.color).filter(Boolean))];
  const COLOR_HEX = { negro: "#1a1a1a", blanco: "#f5f5f5", gris: "#8a8a8a", azul: "#2563eb", rojo: "#dc2626", verde: "#16a34a", arena: "#d9b98a", rosa: "#f472b6", amarillo: "#eab308", naranja: "#f97316", marron: "#7c4a2d", carey: "#8b5a2b", plateado: "#c0c0c0", dorado: "#d4af37", violeta: "#7c3aed" };
  const colorHex = (name) => COLOR_HEX[(name || "").toLowerCase()] || "#9ca3af";
  const stars = [5, 4, 3, 2, 1].map((s) => ({
    s,
    n: reviews.filter((r) => r.rating === s).length,
  }));
  const related = AAO.PRODUCTS.filter((x) => x.cat === p.cat && x.id !== p.id);
  const together = related.slice(0, 2);

  /* ── Render ── */
  root.innerHTML = `
    <nav class="crumbs" aria-label="Migas de pan">
      <a href="index.html">Inicio</a><span aria-hidden="true">›</span>
      <a href="categoria.html?cat=${p.cat}">${AAO.CAT_LABELS[p.cat]}</a><span aria-hidden="true">›</span>
      <span>${p.name}</span>
    </nav>

    <div class="pd__main">
      <!-- Galería -->
      <div class="pd__gallery">
        <div class="pd__thumbs" id="pdThumbs">
          ${gallery.length ? gallery.map((src, i) => `
            <button class="pd__thumb ${i === 0 ? "is-active" : ""}" data-src="${src}" aria-label="Imagen ${i + 1} de ${p.name}">
              <img src="${src}" alt="" loading="lazy" onerror="this.remove()">
            </button>`).join("") : `
            <button class="pd__thumb is-active" data-src="" aria-label="Vista del producto">
              <span style="display:grid;place-items:center;width:100%;height:100%;background:linear-gradient(140deg, ${p.g[0]}, ${p.g[1]})">${AAO.icon(p.icon)}</span>
            </button>`}
        </div>
        <div class="pd__stage" id="pdStage" style="background:linear-gradient(140deg, ${p.g[0]}, ${p.g[1]})">
          ${AAO.icon(p.icon, "pd__fallback")}
          ${gallery.length ? `<img class="pd__img" id="pdImg" src="${gallery[0]}" alt="${p.name}" onerror="this.remove()">` : ""}
        </div>
      </div>

      <!-- Info -->
      <div class="pd__info">
        <h1 class="pd__title">${p.name}</h1>
        <p class="pd__meta">Marca: <a href="categoria.html?cat=${p.cat}">All At Once · ${AAO.CAT_LABELS[p.cat]}</a></p>
        <div class="pd__rating">
          ${AAO.starsHTML(p.rating)}
          <a href="#opiniones">${p.reviews.toLocaleString("es-ES")} valoraciones</a>
        </div>
        <hr class="pd__divider">
        <div class="pd__price-row">
          <span class="pd__off">-${AAO.discount(p)}%</span>
          <span class="pd__price">${AAO.fmt.format(p.price)}</span>
          <s class="pd__old">${AAO.fmt.format(p.old)}</s>
        </div>
        <p class="pd__vat">Precio final con IVA incluido</p>
        <div class="pd__delivery">
          ${AAO.icon("truck")}
          <div>
            ${p.prime
              ? `<strong>Envío exprés GRATIS</strong> — llega <strong>${deliveryDate(p)}</strong>`
              : `Envío estándar ${AAO.fmt.format(AAO.SHIP_COST)} — llega <strong>${deliveryDate(p)}</strong>`}
            <small>Devoluciones gratis hasta 30 días</small>
          </div>
        </div>
        ${variants.length ? `
        <div class="pd__variants">
          <h3>Opciones disponibles</h3>
          ${tallas.length ? `
            <p class="pd__optlabel">Talla</p>
            <div class="pd__sizes" id="pdSizes">
              ${tallas.map((t, i) => `<button class="pd__size ${i === 0 ? "is-active" : ""}" data-talla="${esc(t)}">${esc(t)}</button>`).join("")}
            </div>` : ""}
          ${colores.length ? `
            <p class="pd__optlabel">Color</p>
            <div class="pd__colors" id="pdColors">
              ${colores.map((cl, i) => `<button class="pd__color ${i === 0 ? "is-active" : ""}" data-color="${esc(cl)}" style="background:${colorHex(cl)}" title="${esc(cl)}" aria-label="${esc(cl)}"></button>`).join("")}
            </div>` : ""}
          <p class="pd__varstock" id="pdVarStock"></p>
        </div>` : ""}
        <hr class="pd__divider">
        <h2 style="font-family:var(--font-display);font-size:1.05rem;margin-bottom:10px">Acerca de este producto</h2>
        <ul class="pd__feats">
          ${feats.map((f) => `<li>${f}</li>`).join("")}
        </ul>
        ${p.cat === "Moda" ? `
        <details class="acc" style="margin-top:18px">
          <summary>Guía de tallas</summary>
          <div class="acc__body">
            <table>
              <tr><th>Talla</th><th>Pecho</th><th>Cintura</th><th>Cadera</th></tr>
              <tr><td>S</td><td>88–92 cm</td><td>72–76 cm</td><td>92–96 cm</td></tr>
              <tr><td>M</td><td>93–99 cm</td><td>77–83 cm</td><td>97–103 cm</td></tr>
              <tr><td>L</td><td>100–106 cm</td><td>84–90 cm</td><td>104–110 cm</td></tr>
              <tr><td>XL</td><td>107–113 cm</td><td>91–97 cm</td><td>111–117 cm</td></tr>
              <tr><td>XXL</td><td>114–120 cm</td><td>98–104 cm</td><td>118–124 cm</td></tr>
            </table>
          </div>
        </details>` : ""}
      </div>

      <!-- Caja de compra -->
      <aside class="pd__buy">
        <p class="pd__buy-price">${AAO.fmt.format(p.price)}</p>
        <p class="pd__buy-delivery">
          ${p.prime
            ? `<strong>Envío GRATIS</strong> ${deliveryDate(p)}`
            : `Envío: <strong>${AAO.fmt.format(AAO.SHIP_COST)}</strong> · ${deliveryDate(p)}`}
        </p>
        <p class="pd__buy-where">Vendido y enviado por <strong>All At Once</strong></p>
        <p class="pd__stock ${p.stock > 65 ? "is-low" : ""}">
          ${p.stock > 65 ? `¡Date prisa! Ya se ha vendido el ${p.stock}%` : "En stock"}
        </p>
        <label class="pd__qty">Cantidad:
          <select id="pdQty" aria-label="Cantidad">
            ${[1, 2, 3, 4, 5].map((n) => `<option value="${n}">${n}</option>`).join("")}
          </select>
        </label>
        <button class="btn btn--primary" id="pdAdd">${AAO.icon("cart")} Añadir a la cesta</button>
        <button class="btn btn--buy" id="pdBuy">Comprar ahora</button>
        <button class="btn btn--outline" id="pdFav" style="margin-top:10px">${AAO.icon("heart")} <span>Añadir a favoritos</span></button>
        <p class="pd__secure">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Transacción segura
        </p>
      </aside>
    </div>

    <!-- Descripción del producto -->
    <section class="pd__desc">
      <h2>Descripción del producto</h2>
      <p class="pd__desc-text">${DESCRIPTIONS[p.id] || `${p.name}: producto de la colección ${AAO.CAT_LABELS[p.cat]} de All At Once, seleccionado por su calidad y valoración de clientes.`}</p>
      <dl class="pd__specs">
        ${Object.entries(SPECS[p.id] || {}).map(([k, v]) => `
          <div class="pd__spec-row">
            <dt>${k.replace(/_/g, " ")}</dt>
            <dd>${v}</dd>
          </div>`).join("")}
      </dl>
    </section>

    <!-- Frecuentemente comprados juntos (referencia: amazon.com) -->
    ${together.length ? `
    <section class="together">
      <h2>Frecuentemente comprados juntos</h2>
      <div class="together__layout">
        <div class="together__items">
          <div class="together__item together__item--current">
            <p class="together__tag">Este artículo:</p>
            <a class="together__media" href="producto.html?id=${p.id}" style="background:linear-gradient(140deg, ${p.g[0]}, ${p.g[1]})">
              ${AAO.icon(p.icon, "together__fallback")}
              <img src="${p.img}" alt="${p.name}" loading="lazy" onerror="this.remove()">
            </a>
            <a class="together__name" href="producto.html?id=${p.id}">${p.name}</a>
            ${AAO.starsHTML(p.rating)}
            <p class="together__price">${AAO.fmt.format(p.price)}</p>
          </div>
          ${together.map((x) => `
            <span class="together__plus" aria-hidden="true">+</span>
            <div class="together__item">
              <label class="together__check">
                <input type="checkbox" data-together="${x.id}" checked>
                <span class="sr-only">Incluir ${x.name}</span>
              </label>
              <a class="together__media" href="producto.html?id=${x.id}" style="background:linear-gradient(140deg, ${x.g[0]}, ${x.g[1]})">
                ${AAO.icon(x.icon, "together__fallback")}
                <img src="${x.img}" alt="${x.name}" loading="lazy" onerror="this.remove()">
              </a>
              <a class="together__name" href="producto.html?id=${x.id}">${x.name}</a>
              ${AAO.starsHTML(x.rating)}
              <p class="together__price">${AAO.fmt.format(x.price)}</p>
            </div>`).join("")}
        </div>
        <div class="together__summary">
          <p class="together__total-label">Precio total:</p>
          <p class="together__total" id="togetherTotal"></p>
          <button class="btn btn--buy together__addall" id="togetherAdd">${AAO.icon("cart")} Añadir al carrito</button>
        </div>
      </div>
    </section>` : ""}

    <!-- Opiniones -->
    <section class="pd__reviews" id="opiniones">
      <h2>Opiniones de clientes</h2>
      <div class="pd__rev-layout">
        <aside class="pd__rev-summary">
          <p class="pd__rev-big">${p.rating}</p>
          ${AAO.starsHTML(p.rating)}
          <p class="pd__rev-count">${p.reviews.toLocaleString("es-ES")} valoraciones globales</p>
          <div class="pd__bars">
            ${stars.map(({ s, n }) => `
              <div class="pd__bar">
                <span>${s} ★</span>
                <div class="pd__bar-track"><div class="pd__bar-fill" style="width:${reviews.length ? Math.round((n / reviews.length) * 100) : 0}%"></div></div>
                <b>${Math.round((n / reviews.length) * 100)}%</b>
              </div>`).join("")}
          </div>
        </aside>
        <div class="pd__rev-list">
          ${reviews.map((r) => `
            <article class="pd__rev">
              <div class="pd__rev-head">
                <span class="pd__rev-avatar">${r.name.charAt(0)}</span>
                <div>
                  <p class="pd__rev-name">${r.name}</p>
                  <p class="pd__rev-date">${r.date}</p>
                </div>
                ${r.verified ? `<span class="pd__rev-verified">${AAO.icon("check")} Compra verificada</span>` : ""}
              </div>
              ${AAO.starsHTML(r.rating)}
              <p class="pd__rev-title">${r.title}</p>
              <p class="pd__rev-text">${r.text}</p>
            </article>`).join("")}
        </div>
      </div>
    </section>

    <!-- Relacionados -->
    ${related.length ? `
    <section class="pd__related">
      <h2>Productos relacionados</h2>
      <div class="rows">
        ${related.map((x, i) => AAO.productCardHTML(x, i)).join("")}
      </div>
    </section>` : ""}
  `;

  /* ── Galería: miniaturas reales (imágenes del admin) + zoom ── */
  const stage = $("#pdStage");
  $("#pdThumbs").addEventListener("click", (e) => {
    const thumb = e.target.closest(".pd__thumb");
    if (!thumb || !thumb.dataset.src) return;
    document.querySelectorAll(".pd__thumb").forEach((t) => t.classList.remove("is-active"));
    thumb.classList.add("is-active");
    const main = $("#pdImg");
    if (main) { main.src = thumb.dataset.src; stage.classList.remove("is-zoomed"); }
  });
  stage.addEventListener("click", () => { if ($("#pdImg")) stage.classList.toggle("is-zoomed"); });
  stage.addEventListener("mousemove", (e) => {
    if (!stage.classList.contains("is-zoomed")) return;
    const rect = stage.getBoundingClientRect();
    const img = stage.querySelector(".pd__img");
    if (img) img.style.transformOrigin =
      `${((e.clientX - rect.left) / rect.width) * 100}% ${((e.clientY - rect.top) / rect.height) * 100}%`;
  });

  /* ── Variantes: selección con stock individual ── */
  if (variants.length) {
    let selTalla = tallas[0] || null;
    let selColor = colores[0] || null;
    const stockOf = () => {
      const exact = variants.filter((vr) => (!vr.talla || vr.talla === selTalla) && (!vr.color || vr.color === selColor));
      const list = exact.length ? exact : variants.filter((vr) => !vr.talla || vr.talla === selTalla);
      return list.reduce((s, vr) => s + (Number(vr.stock) || 0), 0);
    };
    const updateStock = () => {
      const n = stockOf();
      const el = $("#pdVarStock");
      if (!el) return;
      el.textContent = n > 0 ? `${n} unidades en stock para esta combinación` : "Combinación agotada — prueba otra talla o color";
      el.style.color = n > 0 ? "var(--green)" : "var(--accent-dark)";
    };
    const bindOpts = (id, attr, set) => {
      const box = $(id);
      if (!box) return;
      box.addEventListener("click", (e) => {
        const btn = e.target.closest("[" + attr + "]");
        if (!btn) return;
        box.querySelectorAll(".is-active").forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        set(btn.getAttribute(attr));
        updateStock();
      });
    };
    bindOpts("#pdSizes", "data-talla", (v) => { selTalla = v; });
    bindOpts("#pdColors", "data-color", (v) => { selColor = v; });
    updateStock();
  }

  /* ── Compra ── */
  const qty = () => Number($("#pdQty").value);

  $("#pdAdd").addEventListener("click", () => {
    AAO.CartStore.add(p.id, qty());
    AAO.syncCartBadge();
    AAO.aaoToast(`${p.name} añadido al carrito`);
  });
  $("#pdBuy").addEventListener("click", () => {
    AAO.CartStore.add(p.id, qty());
    window.location.href = "index.html?cart=open";
  });

  /* Favorito en la ficha (persistente) */
  const getFavs = () => new Set(JSON.parse(localStorage.getItem("aao_wishlist") || "[]"));
  const pdFav = $("#pdFav");
  const syncFavBtn = () => {
    const on = getFavs().has(p.id);
    pdFav.querySelector("span").textContent = on ? "Guardado en favoritos" : "Añadir a favoritos";
    pdFav.style.cssText = on
      ? "margin-top:10px;border-color:var(--accent);color:var(--accent)"
      : "margin-top:10px";
    pdFav.querySelector("svg").style.fill = on ? "var(--accent)" : "none";
  };
  pdFav.addEventListener("click", () => {
    const favs = getFavs();
    if (favs.has(p.id)) { favs.delete(p.id); AAO.aaoToast("Eliminado de favoritos"); }
    else { favs.add(p.id); AAO.aaoToast("Guardado en favoritos"); }
    localStorage.setItem("aao_wishlist", JSON.stringify([...favs]));
    syncFavBtn();
  });
  syncFavBtn();

  /* ── Frecuentemente comprados juntos ── */
  const totalEl = $("#togetherTotal");
  const addAllBtn = $("#togetherAdd");

  if (totalEl && addAllBtn) {
    function togetherSelection() {
      const boxes = [...document.querySelectorAll("[data-together]")];
      return boxes.filter((b) => b.checked).map((b) => AAO.byId(b.dataset.together));
    }

    function updateTogether() {
      const sel = togetherSelection();
      const total = p.price + sel.reduce((sum, x) => sum + x.price, 0);
      const n = 1 + sel.length;
      totalEl.textContent = AAO.fmt.format(total);
      addAllBtn.innerHTML = `${AAO.icon("cart")} Añadir los ${n} al carrito`;
      addAllBtn.disabled = sel.length === 0;
    }

    document.querySelectorAll("[data-together]").forEach((b) =>
      b.addEventListener("change", updateTogether)
    );
    addAllBtn.addEventListener("click", () => {
      const sel = togetherSelection();
      AAO.CartStore.add(p.id);
      sel.forEach((x) => AAO.CartStore.add(x.id));
      AAO.syncCartBadge();
      AAO.aaoToast(`${1 + sel.length} artículos añadidos al carrito`);
    });
    updateTogether();
  }

  /* ── Añadir desde relacionados ── */
  root.addEventListener("click", (e) => {
    const addBtn = e.target.closest("[data-add]");
    if (addBtn) {
      AAO.CartStore.add(addBtn.dataset.add);
      AAO.syncCartBadge();
      AAO.aaoToast(`${AAO.byId(addBtn.dataset.add).name} añadido al carrito`);
    }
  });

  /* ── Buscador y menú móvil ── */
  $("#searchForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const q = $("#searchInput").value.trim();
    if (q) window.location.href = "index.html?q=" + encodeURIComponent(q);
  });
  $("#burger").addEventListener("click", () => {
    $("#burger").classList.toggle("is-open");
    $("#catnav").classList.toggle("is-open");
  });

  AAO.syncCartBadge();
  AAO.aaoCountdown();
})();
