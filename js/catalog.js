/* ═══════════════════════════════════════════════════════════
   ALL AT ONCE — Catálogo compartido
   Datos de productos, tarjetas HTML, carrito persistente,
   toast y countdown. Usado por index, categoría y producto.
   ═══════════════════════════════════════════════════════════ */

"use strict";

/* ─────────── Iconos SVG ─────────── */
const PATHS = {
  headphones: '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/>',
  smartwatch: '<rect x="7" y="7" width="10" height="10" rx="3"/><path d="M12 10v2l1.5 1.5"/><path d="M9 7V4h6v3M9 17v3h6v-3"/>',
  speaker: '<rect x="6" y="3" width="12" height="18" rx="3"/><circle cx="12" cy="14.5" r="3"/><circle cx="12" cy="7.5" r="1"/>',
  shoe: '<path d="M3 16c0-1 .5-2 2-2 2.5 0 3.5-2 4-4 .3-1 1.2-1.4 2-1 2 1 4 3 6 4 2 .8 4 1 4 3v1H3v-1z"/><path d="M3 17h18"/>',
  jacket: '<path d="M9 4 5 6 3 11l3 1v8h12v-8l3-1-2-5-4-2a3 3 0 0 1-6 0z"/><path d="M12 4v16"/>',
  backpack: '<path d="M7 9a5 5 0 0 1 10 0v10a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V9z"/><path d="M7 13h10"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/>',
  glasses: '<circle cx="7" cy="14" r="3.5"/><circle cx="17" cy="14" r="3.5"/><path d="M10.5 14h3M3.5 13l-1-3.5M20.5 13l1-3.5"/>',
  lamp: '<path d="M8 3h8l3.5 8h-15L8 3z"/><path d="M12 11v7"/><path d="M8.5 21h7"/><path d="M10 18h4"/>',
  mug: '<path d="M5 8h11v8a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8z"/><path d="M16 9.5h2a2.5 2.5 0 0 1 0 5h-2"/>',
  drop: '<path d="M12 3s6 6.6 6 11a6 6 0 0 1-12 0c0-4.4 6-11 6-11z"/>',
  perfume: '<path d="M10 3h4v3h-4z"/><path d="M8 8h8l1 12H7L8 8z"/><path d="M8 8V6h8v2"/>',
  chip: '<rect x="6" y="6" width="12" height="12" rx="2"/><rect x="10" y="10" width="4" height="4"/><path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2"/>',
  watch: '<circle cx="12" cy="12" r="5"/><path d="M12 9.5V12l1.8 1"/><path d="M9.5 3h5M9.5 21h5M9.5 3 10.5 7M14.5 3 13.5 7M9.5 21 10.5 17M14.5 21 13.5 17"/>',
  truck: '<path d="M3 7h11v8H3zM14 10h4l3 3v2h-7z"/><circle cx="7" cy="17" r="1.8"/><circle cx="17" cy="17" r="1.8"/>',
  trash: '<path d="M4 7h16M9.5 7V5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2M6.5 7l1 13h9l1-13"/>',
  star: '<path fill="currentColor" stroke="none" d="M12 2.6l2.9 5.9 6.5 1-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.2 1.1-6.5L2.6 9.5l6.5-1L12 2.6z"/>',
  heart: '<path d="M19 14c1.5-1.5 3-3.3 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3.4 1-4.5 2.5C10.9 4 9.3 3 7.5 3A5.5 5.5 0 0 0 2 8.5c0 2.2 1.5 4 3 5.5l7 7 7-7z"/>',
  cart: '<circle cx="9" cy="20" r="1.6"/><circle cx="17" cy="20" r="1.6"/><path d="M3 3h2l2.6 12.4a1.5 1.5 0 0 0 1.5 1.1h7.9a1.5 1.5 0 0 0 1.5-1.2L20.5 8H6"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
};

const icon = (name, cls = "") =>
  `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PATHS[name]}</svg>`;

/* ─────────── Imágenes (Unsplash) ─────────── */
const U = (id) => `https://images.unsplash.com/${id}?q=80&w=800&auto=format&fit=crop`;

/* ─────────── Catálogo ─────────── */
const PRODUCTS = [
  { id: 1,  name: "Auriculares Nova X",         cat: "Tech",       price: 89.99,  old: 149.99, rating: 4.8, reviews: 2341, badge: "flash", icon: "headphones", g: ["#FF6A00", "#FF3D1F"], img: U("photo-1505740420928-5e560c06d30e"), prime: true,  stock: 78, deal: true },
  { id: 2,  name: "Smartwatch Fit Pro",         cat: "Tech",       price: 99.00,  old: 159.00, rating: 4.7, reviews: 1876, badge: "flash", icon: "smartwatch", g: ["#7C3AED", "#4F46E5"], img: U("photo-1546868871-7041f2a55e12"), prime: true,  stock: 64, deal: true },
  { id: 3,  name: "Altavoz Pulse Boom",         cat: "Tech",       price: 65.99,  old: 99.99,  rating: 4.6, reviews: 982,  badge: null,      icon: "speaker",    g: ["#0EA5E9", "#2563EB"], img: U("photo-1608043152269-423dbba4e7e1"), prime: true,  stock: 82, deal: true },
  { id: 4,  name: "Zapatillas Velocity Runner", cat: "Moda",       price: 74.50,  old: 110.00, rating: 4.9, reviews: 3120, badge: "top",     icon: "shoe",       g: ["#F43F5E", "#FB7185"], img: U("photo-1542291026-7eec264c27ff"), prime: true,  stock: 55, deal: false },
  { id: 5,  name: "Chaqueta North Wind",        cat: "Moda",       price: 129.00, old: 180.00, rating: 4.7, reviews: 640,  badge: null,      icon: "jacket",     g: ["#334155", "#0F172A"], img: U("photo-1551028719-00167b16eac5"), prime: false, stock: 40, deal: true },
  { id: 6,  name: "Mochila Urban Flex",         cat: "Moda",       price: 54.00,  old: 79.00,  rating: 4.5, reviews: 1518, badge: null,      icon: "backpack",   g: ["#F59E0B", "#F97316"], img: U("photo-1553062407-98eeb64c6a62"), prime: true,  stock: 71, deal: false },
  { id: 7,  name: "Gafas de Sol Riviera",       cat: "Accesorios", price: 39.00,  old: 65.00,  rating: 4.4, reviews: 733,  badge: "flash",   icon: "glasses",    g: ["#10B981", "#0D9488"], img: U("photo-1572635196237-14b3f281503f"), prime: true,  stock: 88, deal: true },
  { id: 8,  name: "Reloj Minimal Steel",        cat: "Accesorios", price: 119.00, old: 169.00, rating: 4.8, reviews: 1204, badge: null,      icon: "watch",      g: ["#64748B", "#334155"], img: U("photo-1524805444758-089113d48a6d"), prime: false, stock: 33, deal: false },
  { id: 9,  name: "Lámpara Luna Desk",          cat: "Hogar",      price: 45.00,  old: 69.00,  rating: 4.6, reviews: 421,  badge: "new",     icon: "lamp",       g: ["#8B5CF6", "#D946EF"], img: U("photo-1507473885765-e6ed057f782c"), prime: true,  stock: 60, deal: true },
  { id: 10, name: "Set Cerámica Atelier ×4",    cat: "Hogar",      price: 29.90,  old: 49.90,  rating: 4.7, reviews: 356,  badge: null,      icon: "mug",        g: ["#EC4899", "#F43F5E"], img: U("photo-1514228742587-6b1558fcca3d"), prime: false, stock: 47, deal: false },
  { id: 11, name: "Kit Skincare Glow",          cat: "Belleza",    price: 49.00,  old: 85.00,  rating: 4.8, reviews: 2093, badge: "flash",   icon: "drop",       g: ["#F472B6", "#FB7185"], img: U("photo-1556228720-195a672e8a03"), prime: true,  stock: 91, deal: true },
  { id: 12, name: "Perfume Nocturne 50 ml",     cat: "Belleza",    price: 79.00,  old: 120.00, rating: 4.9, reviews: 1687, badge: "top",     icon: "perfume",    g: ["#A855F7", "#7C3AED"], img: U("photo-1541643600914-78b084683601"), prime: true,  stock: 52, deal: true },
];

const CATEGORIES = [
  { name: "Tech",       label: "Tecnología", icon: "chip",   g: ["#2563EB", "#0EA5E9"], extras: [U("photo-1518770660439-4636190af475"), U("photo-1498049794561-7780e7231661")] },
  { name: "Moda",       label: "Moda",       icon: "jacket", g: ["#F43F5E", "#FB923C"], extras: [U("photo-1445205170230-053b83016050"), U("photo-1441986300917-64674bd600d8")] },
  { name: "Hogar",      label: "Hogar",      icon: "lamp",   g: ["#8B5CF6", "#D946EF"], extras: [U("photo-1567016432779-094069958ea5"), U("photo-1524758631624-e2822e304c36")] },
  { name: "Belleza",    label: "Belleza",    icon: "drop",   g: ["#EC4899", "#F472B6"], extras: [U("photo-1596462502278-27bfdc403348"), U("photo-1571781926291-c477ebfd024b")] },
  { name: "Accesorios", label: "Accesorios", icon: "watch",  g: ["#0F766E", "#10B981"], extras: [] },
];

const CAT_LABELS = { Tech: "Tecnología", Moda: "Moda", Hogar: "Hogar", Belleza: "Belleza", Accesorios: "Accesorios" };

/* ─────────── Ajustes de tienda (admin → Configuración) ─────────── */
const SETTINGS = {
  tienda: "All At Once",
  iva: 21,
  moneda: "EUR",
  envioGratis: 75,
  envioCoste: 4.99,
  ...JSON.parse(localStorage.getItem("aao_settings") || "{}"),
};

const FREE_SHIP = SETTINGS.envioGratis;
const SHIP_COST = SETTINGS.envioCoste;
const IVA = SETTINGS.iva / 100;

/* ─────────── Utilidades ─────────── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

const fmt = new Intl.NumberFormat("es-ES", { style: "currency", currency: SETTINGS.moneda });
const byId = (id) => PRODUCTS.find((p) => p.id === Number(id));
const discount = (p) => Math.round((1 - p.price / p.old) * 100);

/* ─────────── Datos del admin: overrides + altas + categorías ─────────── */
(function applyAdminData() {
  let overrides = {}, customs = [], catOverrides = {}, customCats = [];
  try { overrides = JSON.parse(localStorage.getItem("aao_product_overrides") || "{}"); } catch (e) {}
  try { customs = JSON.parse(localStorage.getItem("aao_products_custom") || "[]"); } catch (e) {}
  try { catOverrides = JSON.parse(localStorage.getItem("aao_categories_overrides") || "{}"); } catch (e) {}
  try { customCats = JSON.parse(localStorage.getItem("aao_categories_custom") || "[]"); } catch (e) {}

  customs.forEach((p) => { if (!PRODUCTS.some((x) => x.id === p.id)) PRODUCTS.push(p); });
  Object.entries(overrides).forEach(([id, patch]) => {
    const p = PRODUCTS.find((x) => x.id === Number(id));
    if (p) Object.assign(p, patch);
  });
  customCats.forEach((c) => { if (!CATEGORIES.some((x) => x.name === c.name)) CATEGORIES.push(c); });
  Object.entries(catOverrides).forEach(([name, patch]) => {
    const c = CATEGORIES.find((x) => x.name === name);
    if (c) Object.assign(c, patch);
    if (patch.label) CAT_LABELS[name] = patch.label;
  });
})();

/* Catálogo completo (incluye borradores) para el admin; el escaparate
   solo ve los publicados */
const ALL_PRODUCTS = [...PRODUCTS];
for (let i = PRODUCTS.length - 1; i >= 0; i--) {
  if (PRODUCTS[i].estado === "borrador") PRODUCTS.splice(i, 1);
}

/* ─────────── Reseñas (generadas + moderables desde el admin) ─────────── */
const REVIEW_NAMES = ["María G.", "Piero L.", "Sofía R.", "Luca M.", "Ana B.", "Marco T.", "Elena V.", "Diego F.", "Chiara P.", "Hugo S.", "Valentina N.", "Andrés C."];
const REVIEW_TITLES = ["Excelente compra", "Superó mis expectativas", "Muy buena calidad", "Justo lo que buscaba", "Relación calidad-precio increíble", "Llegó rapidísimo", "Muy recomendable", "Bastante bien", "Repitiré seguro", "Muy contento"];
const REVIEW_TEXTS = [
  "Lo pedí con la oferta del día y llegó en menos de 48h. La calidad es tal como se describe en la página. Muy contento con la compra.",
  "Dudaba por el precio, pero la calidad me ha sorprendido. Se nota que es un producto bien hecho. Lo recomiendo sin dudar.",
  "Cumple perfectamente lo que promete. El embalaje venía impecable y el envío fue rapidísimo. Volveré a comprar en All At Once.",
  "Lo llevo usando un par de semanas y funciona de maravilla. Eso sí, el color es ligeramente más oscuro que en las fotos.",
  "Compra excelente. El servicio de atención al cliente me resolvió una duda en minutos. El producto, de diez.",
  "Muy buena relación calidad-precio. No es perfecto, pero por lo que cuesta está genial. Llegó un día antes de lo previsto.",
  "Es el segundo que compro y la calidad se mantiene. Envío rápido y bien protegido. Muy recomendable.",
  "Producto sólido y con buen acabado. El envío exprés funciona de verdad: lo pedí por la mañana y al día siguiente estaba en casa.",
  "Está bien, aunque esperaba algo más grande. Revisad las medidas antes de comprar. Por lo demás, sin quejas.",
  "Increíble por este precio. Se nota que All At Once selecciona bien sus productos. Cinco estrellas merecidas.",
];

function rng(seed) {
  let a = (seed * 2654435761) >>> 0;
  return () => ((a = (a * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function allReviewsFor(prod) {
  const r = rng(prod.id * 97 + 13);
  const n = 5 + Math.floor(r() * 3);
  const reviews = [];
  const usedT = new Set(), usedX = new Set();
  for (let i = 0; i < n; i++) {
    const roll = r();
    const rating = roll < (prod.rating - 3.35) ? 5 : roll < 0.87 ? 4 : 3;
    let ti = Math.floor(r() * REVIEW_TITLES.length);
    let xi = Math.floor(r() * REVIEW_TEXTS.length);
    while (usedT.has(ti)) ti = (ti + 1) % REVIEW_TITLES.length;
    while (usedX.has(xi)) xi = (xi + 1) % REVIEW_TEXTS.length;
    usedT.add(ti); usedX.add(xi);
    reviews.push({
      name: REVIEW_NAMES[Math.floor(r() * REVIEW_NAMES.length)],
      rating,
      title: REVIEW_TITLES[ti],
      text: REVIEW_TEXTS[xi],
      date: `hace ${1 + Math.floor(r() * 89)} días`,
      verified: r() < 0.85,
    });
  }
  return reviews;
}

function hiddenReviewIndexes() {
  try { return JSON.parse(localStorage.getItem("aao_reviews_hidden") || "{}"); } catch (e) { return {}; }
}

function reviewsFor(prod) {
  const hidden = hiddenReviewIndexes()[prod.id] || [];
  return allReviewsFor(prod).filter((_, i) => !hidden.includes(i));
}

/* ─────────── Métodos de envío y pago (admin → Envíos/Pagos) ─────────── */
const DEFAULT_SHIPPING = [
  { id: "estandar", nombre: "Estándar", desc: "3–5 días laborables", precio: SETTINGS.envioCoste, gratisDesde: SETTINGS.envioGratis, extra: 0, dias: 4, activo: true },
  { id: "express", nombre: "Exprés 24/48 h", desc: "Con seguimiento en tiempo real", precio: 9.99, gratisDesde: null, extra: 0, dias: 1, activo: true },
  { id: "reembolso", nombre: "Contra reembolso", desc: "Pagas al recibir en casa", precio: SETTINGS.envioCoste, gratisDesde: SETTINGS.envioGratis, extra: 3.5, dias: 4, activo: true },
];
const DEFAULT_PAYMENTS = [
  { id: "tarjeta", nombre: "Tarjeta", desc: "Visa, Mastercard, Amex · cifrado seguro", activo: true },
  { id: "paypal", nombre: "PayPal", desc: "Serás redirigido para completar el pago", activo: true },
  { id: "reembolso", nombre: "Contra reembolso", desc: "Suplemento de gestión", activo: true },
];
const shippingMethods = () => JSON.parse(localStorage.getItem("aao_shipping_methods") || "null") || DEFAULT_SHIPPING;
const paymentMethods = () => JSON.parse(localStorage.getItem("aao_payment_methods") || "null") || DEFAULT_PAYMENTS;

/* ─────────── Badges / estrellas ─────────── */
const badgeHTML = (p) => {
  if (p.badge === "flash") return `<span class="pill pill--off">-${discount(p)}%</span>`;
  if (p.badge === "new")   return `<span class="pill pill--new">Nuevo</span>`;
  if (p.badge === "top")   return `<span class="pill pill--top">Top ventas</span>`;
  return "";
};

const starsHTML = (rating) => {
  const full = Math.round(rating);
  let out = "";
  for (let i = 1; i <= 5; i++) {
    out += `<span class="${i <= full ? "" : "star--off"}">${icon("star")}</span>`;
  }
  return `<span class="stars">${out}</span>`;
};

/* ─────────── Tarjetas (enlazan a la ficha de producto) ─────────── */
function productCardHTML(p, i = 0, wished = false) {
  return `
    <article class="card" style="animation-delay:${Math.min(i * 55, 400)}ms">
      <a class="card__media" href="producto.html?id=${p.id}" style="background:linear-gradient(140deg, ${p.g[0]}, ${p.g[1]})" aria-label="Ver ${p.name}">
        ${icon(p.icon, "card__fallback")}
        <img class="card__img" src="${p.img}" alt="${p.name}" loading="lazy" onerror="this.remove()">
        ${badgeHTML(p)}
      </a>
      <button class="card__wish ${wished ? "is-wished" : ""}" data-wish="${p.id}" aria-label="Añadir a favoritos">${icon("heart")}</button>
      <div class="card__body">
        <span class="card__cat">${p.cat}</span>
        <h3 class="card__name"><a href="producto.html?id=${p.id}">${p.name}</a></h3>
        <div class="card__rating">${starsHTML(p.rating)}<span class="card__reviews">${p.rating} (${p.reviews.toLocaleString("es-ES")})</span></div>
        <div class="card__foot">
          <div class="card__price"><strong>${fmt.format(p.price)}</strong><s>${fmt.format(p.old)}</s></div>
          <button class="card__add" data-add="${p.id}">${icon("cart")}<span>Añadir</span></button>
        </div>
        ${p.prime ? `<span class="card__prime">${icon("truck")} Envío exprés 24 h</span>` : ""}
      </div>
    </article>`;
}

function dealCardHTML(p) {
  return `
    <article class="deal-card">
      <a class="deal-card__media" href="producto.html?id=${p.id}" style="background:linear-gradient(140deg, ${p.g[0]}, ${p.g[1]})" aria-label="Ver ${p.name}">
        ${icon(p.icon, "deal-card__fallback")}
        <img class="deal-card__img" src="${p.img}" alt="${p.name}" loading="lazy" onerror="this.remove()">
        <span class="deal-card__off">-${discount(p)}%</span>
      </a>
      <div class="deal-card__body">
        <h3 class="deal-card__name"><a href="producto.html?id=${p.id}">${p.name}</a></h3>
        <p class="deal-card__price"><strong>${fmt.format(p.price)}</strong> <s>${fmt.format(p.old)}</s></p>
        <div class="deal-card__stock">
          <p>¡${p.stock}% vendido — queda poco stock!</p>
          <div class="deal-card__stock-bar"><div class="deal-card__stock-fill" style="width:${p.stock}%"></div></div>
        </div>
        <button class="btn btn--primary" data-add="${p.id}">${icon("cart")} Añadir</button>
      </div>
    </article>`;
}

/* ─────────── Carrito persistente (compartido entre páginas) ─────────── */
const CartStore = {
  KEY: "aao_cart",
  load() { return new Map(JSON.parse(localStorage.getItem(this.KEY) || "[]")); },
  save(map) { localStorage.setItem(this.KEY, JSON.stringify([...map])); },
  count() { return [...this.load().values()].reduce((a, b) => a + b, 0); },
  add(id, qty = 1) {
    const m = this.load();
    m.set(Number(id), (m.get(Number(id)) || 0) + qty);
    this.save(m);
  },
};

function syncCartBadge() {
  const n = CartStore.count();
  const b = document.getElementById("cartCount");
  if (!b) return;
  b.hidden = n === 0;
  b.textContent = n;
}

/* ─────────── Toast / countdown compartidos ─────────── */
function aaoToast(msg) {
  const el = document.getElementById("toast");
  if (!el) return;
  const span = el.querySelector("#toastMsg");
  if (span) span.textContent = msg;
  el.classList.add("is-show");
  clearTimeout(aaoToast._t);
  aaoToast._t = setTimeout(() => el.classList.remove("is-show"), 2400);
}

function aaoCountdown() {
  const pad = (n) => String(n).padStart(2, "0");
  const tick = () => {
    const now = new Date();
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    const s = Math.max(0, Math.floor((end - now) / 1000));
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set("flashCountdown", `${pad(h)}:${pad(m)}:${pad(sec)}`);
    set("cdH", pad(h)); set("cdM", pad(m)); set("cdS", pad(sec));
  };
  tick();
  setInterval(tick, 1000);
}

/* ─────────── Cupones ─────────── */
const BASE_COUPONS = {
  AAO10: { tipo: "pct", valor: 10, descripcion: "-10% en tu pedido" },
  FLASH20: { tipo: "pct", valor: 20, descripcion: "-20% venta flash" },
};

function allCoupons() {
  return { ...BASE_COUPONS, ...(JSON.parse(localStorage.getItem("aao_coupons") || "{}")) };
}

function couponDiscount(code, subtotal) {
  const c = allCoupons()[(code || "").toUpperCase().trim()];
  if (!c) return null;
  if (c.tipo === "pct") return { code: code.toUpperCase().trim(), label: `-${c.valor}%`, amount: subtotal * (c.valor / 100), descripcion: c.descripcion };
  const amount = Math.min(c.valor, subtotal);
  return { code: code.toUpperCase().trim(), label: `-${fmt.format(c.valor)}`, amount, descripcion: c.descripcion };
}

window.AAO = {
  PRODUCTS, ALL_PRODUCTS, CATEGORIES, CAT_LABELS,
  byId, discount, fmt, icon, starsHTML, productCardHTML, dealCardHTML,
  CartStore, syncCartBadge, aaoToast, aaoCountdown,
  FREE_SHIP, SHIP_COST, IVA, SETTINGS,
  allCoupons, couponDiscount,
  allReviewsFor, reviewsFor, hiddenReviewIndexes,
  shippingMethods, paymentMethods,
};
