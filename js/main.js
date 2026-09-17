/* ═══════════════════════════════════════════════════════════
   ALL AT ONCE — Lógica de la página principal (index.html)
   Depende de catalog.js (catálogo, tarjetas, carrito, toast).
   ═══════════════════════════════════════════════════════════ */

"use strict";

/* Guard: el staff (admin/superadmin) no usa la tienda —
   al entrar en la home va directo al panel de administración. */
if (window.AAO_AUTH && AAO_AUTH.isAdmin()) {
  window.location.replace("admin.html");
} else {

/* ─────────── Slides del carrusel ─────────── */
const SLIDES = [
  { eyebrow: "Venta flash · hasta -50%", title: "Todo en tecnología, al mejor precio", sub: "Auriculares, smartwatches y altavoces con envío exprés y 2 años de garantía.", cta: "Ver ofertas flash", href: "categoria.html?cat=ofertas", img: U("photo-1498049794561-7780e7231661") },
  { eyebrow: "Nueva colección", title: "Moda que llega volando", sub: "Las zapatillas y chaquetas más vendidas, listas para salir hoy mismo.", cta: "Descubrir moda", href: "categoria.html?cat=Moda", img: U("photo-1483985988355-763728e1935b") },
  { eyebrow: "Hogar & deco", title: "Renueva tu espacio", sub: "Lámparas, cerámica y detalles que convierten una casa en tu casa.", cta: "Ver hogar", href: "categoria.html?cat=Hogar", img: U("photo-1586023492125-27b2c045efd7") },
];

/* ─────────── Estado local de la página ─────────── */
const state = {
  cart: CartStore.load(),
  wishlist: new Set(JSON.parse(localStorage.getItem("aao_wishlist") || "[]")),
  cat: "all",
  query: "",
  sort: "featured",
};

/* ─────────── Render: carrusel promo ─────────── */
let slideIndex = 0;
let slideTimer;

function renderPromo() {
  $("#promoSlides").innerHTML = SLIDES.map((s, i) => `
    <div class="promo__slide">
      <img class="promo__img" src="${s.img}" alt="" ${i > 0 ? 'loading="lazy"' : ""} onerror="this.remove()">
      <div class="promo__overlay"></div>
      <div class="container promo__content">
        <span class="pill pill--hot">${s.eyebrow}</span>
        <h2 class="promo__title">${s.title}</h2>
        <p class="promo__sub">${s.sub}</p>
        <a class="btn btn--primary btn--lg promo__cta" href="${s.href}">${s.cta} ${icon("arrow")}</a>
      </div>
    </div>`).join("");

  $("#promoDots").innerHTML = SLIDES.map((_, i) =>
    `<button class="promo__dot ${i === 0 ? "is-active" : ""}" data-goto="${i}" aria-label="Ir a la promoción ${i + 1}"></button>`).join("");
}

function syncDots() {
  $$(".promo__dot").forEach((d, i) => d.classList.toggle("is-active", i === slideIndex));
}

function goToSlide(i) {
  slideIndex = (i + SLIDES.length) % SLIDES.length;
  const track = $("#promoSlides");
  track.scrollTo({ left: slideIndex * track.clientWidth, behavior: "smooth" });
  syncDots();
}

function startAutoplay() {
  slideTimer = setInterval(() => goToSlide(slideIndex + 1), 6000);
}
function resetAutoplay() {
  clearInterval(slideTimer);
  startAutoplay();
}

/* ─────────── Render: shelf de categorías (enlaza a secciones) ─────────── */
function renderShelf() {
  const cats = CATEGORIES.slice(0, 4);
  $("#shelfGrid").innerHTML = cats.map((c) => {
    const items = PRODUCTS.filter((p) => p.cat === c.name);
    const cells = [
      ...items.map((p) => ({ img: p.img, label: p.name.split(" ").slice(0, 2).join(" ") })),
      ...c.extras.map((img, i) => ({ img, label: i === 0 ? "Novedades" : "Selección" })),
    ].slice(0, 4);
    return `
      <div class="quad reveal">
        <h3>${c.label}</h3>
        <div class="quad__grid">
          ${cells.map((it) => `
            <a class="quad__cell" href="categoria.html?cat=${c.name}">
              <img src="${it.img}" alt="${it.label}" loading="lazy" onerror="this.remove()">
              <span>${it.label}</span>
            </a>`).join("")}
        </div>
        <a class="quad__link" href="categoria.html?cat=${c.name}">Descubrir más ${icon("arrow")}</a>
      </div>`;
  }).join("");
}

/* ─────────── Render: ofertas / más vendidos / grid ─────────── */
function renderDeals() {
  $("#dealsTrack").innerHTML = PRODUCTS.filter((p) => p.deal).map(dealCardHTML).join("");
}

function renderBestsellers() {
  const best = [...PRODUCTS].sort((a, b) => b.reviews - a.reviews).slice(0, 8);
  $("#bestTrack").innerHTML = best.map((p, i) => productCardHTML(p, i, state.wishlist.has(p.id))).join("");
}

function visibleProducts() {
  let list = PRODUCTS.filter((p) =>
    (state.cat === "all" || p.cat === state.cat) &&
    p.name.toLowerCase().includes(state.query)
  );
  switch (state.sort) {
    case "rating":      list = [...list].sort((a, b) => b.rating - a.rating); break;
    case "price-asc":   list = [...list].sort((a, b) => a.price - b.price); break;
    case "price-desc":  list = [...list].sort((a, b) => b.price - a.price); break;
    case "discount":    list = [...list].sort((a, b) => discount(b) - discount(a)); break;
  }
  return list;
}

function renderGrid() {
  const list = visibleProducts();
  $("#gridEmpty").hidden = list.length > 0;
  $("#productGrid").innerHTML = list.map((p, i) => productCardHTML(p, i, state.wishlist.has(p.id))).join("");
}

function syncChips() {
  $$("#chips .chip").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.cat === state.cat);
  });
}

function setCategory(cat) {
  state.cat = cat;
  syncChips();
  renderGrid();
}

/* ─────────── Carrito (persistente vía CartStore) ─────────── */
const cartQty = () => [...state.cart.values()].reduce((a, b) => a + b, 0);
const cartSubtotal = () => [...state.cart.entries()].reduce((sum, [id, q]) => sum + byId(id).price * q, 0);

function addToCart(id, qty = 1) {
  state.cart.set(Number(id), (state.cart.get(Number(id)) || 0) + qty);
  updateCartUI();
  aaoToast(`${byId(id).name} añadido al carrito`);
}

function changeQty(id, delta) {
  const q = (state.cart.get(Number(id)) || 0) + delta;
  if (q <= 0) state.cart.delete(Number(id));
  else state.cart.set(Number(id), q);
  updateCartUI();
}

function removeFromCart(id) {
  state.cart.delete(Number(id));
  updateCartUI();
}

function updateCartUI() {
  CartStore.save(state.cart);
  const qty = cartQty();
  const badge = $("#cartCount");
  badge.hidden = qty === 0;
  badge.textContent = qty;
  $("#cartHeadCount").textContent = qty ? `· ${qty} artículo${qty > 1 ? "s" : ""}` : "";

  const items = $("#cartItems");
  if (state.cart.size === 0) {
    items.innerHTML = `
      <div class="cart__empty">
        ${icon("cart")}
        <p>Tu carrito está vacío.<br>Descubre ofertas que no puedes perderte.</p>
        <a class="btn btn--primary" href="categoria.html?cat=ofertas" id="emptyShopBtn">Explorar ofertas</a>
      </div>`;
  } else {
    items.innerHTML = [...state.cart.entries()].map(([id, q]) => {
      const p = byId(id);
      return `
        <div class="citem">
          <a class="citem__media" href="producto.html?id=${p.id}" style="background:linear-gradient(140deg, ${p.g[0]}, ${p.g[1]})">
            ${icon(p.icon, "citem__fallback")}
            <img class="citem__img" src="${p.img}" alt="${p.name}" onerror="this.remove()">
          </a>
          <div>
            <p class="citem__name">${p.name}</p>
            <p class="citem__price">${fmt.format(p.price)} / ud.</p>
            <div class="citem__qty">
              <button data-qty="-1" data-id="${id}" aria-label="Quitar uno">−</button>
              <span>${q}</span>
              <button data-qty="1" data-id="${id}" aria-label="Añadir uno">+</button>
            </div>
          </div>
          <div class="citem__right">
            <button class="citem__remove" data-remove="${id}" aria-label="Eliminar">${icon("trash")}</button>
            <span class="citem__total">${fmt.format(p.price * q)}</span>
          </div>
        </div>`;
    }).join("");
  }

  const subtotal = cartSubtotal();
  const freeShip = subtotal >= FREE_SHIP;
  const shipping = state.cart.size === 0 ? 0 : freeShip ? 0 : SHIP_COST;
  $("#cartSubtotal").textContent = fmt.format(subtotal);
  $("#cartShipping").textContent = state.cart.size === 0 ? "—" : freeShip ? "Gratis" : fmt.format(SHIP_COST);
  $("#cartTotal").textContent = fmt.format(subtotal + shipping);

  const pct = Math.min(100, (subtotal / FREE_SHIP) * 100);
  $("#shipFill").style.width = `${pct}%`;
  $("#shipMsg").innerHTML = freeShip
    ? `<strong>Envío gratis desbloqueado</strong> — lo recibirás en 24/48h`
    : `Te faltan <strong>${fmt.format(FREE_SHIP - subtotal)}</strong> para el envío gratis`;
}

function openCart() {
  $("#cartDrawer").classList.add("is-open");
  $("#overlay").classList.add("is-open");
  document.body.style.overflow = "hidden";
}
function closeCart() {
  $("#cartDrawer").classList.remove("is-open");
  $("#overlay").classList.remove("is-open");
  document.body.style.overflow = "";
}

/* ─────────── Wishlist (persistente) ─────────── */
function toggleWish(id) {
  if (state.wishlist.has(id)) state.wishlist.delete(id);
  else state.wishlist.add(id);
  localStorage.setItem("aao_wishlist", JSON.stringify([...state.wishlist]));
  const badge = $("#wishCount");
  badge.hidden = state.wishlist.size === 0;
  badge.textContent = state.wishlist.size;
  renderGrid();
  renderBestsellers();
}

/* ─────────── Reveal on scroll ─────────── */
function initReveal() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("is-visible");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  $$(".reveal").forEach((el) => io.observe(el));
}

/* ─────────── Eventos ─────────── */
function bindEvents() {
  document.addEventListener("click", (e) => {
    const addBtn = e.target.closest("[data-add]");
    if (addBtn) {
      addToCart(addBtn.dataset.add);
      if (addBtn.classList.contains("card__add")) {
        addBtn.classList.add("is-added");
        addBtn.innerHTML = `${icon("cart")}<span>Añadido</span>`;
        setTimeout(() => {
          addBtn.classList.remove("is-added");
          addBtn.innerHTML = `${icon("cart")}<span>Añadir</span>`;
        }, 1200);
      }
      return;
    }
    const wishBtn = e.target.closest("[data-wish]");
    if (wishBtn) { toggleWish(Number(wishBtn.dataset.wish)); return; }

    // Chips: filtro local del grid "Descubre más"
    const chip = e.target.closest("#chips .chip");
    if (chip) { setCategory(chip.dataset.cat); return; }

    // Flechas de filas
    const arrow = e.target.closest("[data-scroll]");
    if (arrow) {
      const track = document.getElementById(arrow.dataset.scroll);
      if (track) track.scrollBy({ left: Number(arrow.dataset.dir) * track.clientWidth * 0.8, behavior: "smooth" });
      return;
    }

    const dot = e.target.closest("[data-goto]");
    if (dot) { goToSlide(Number(dot.dataset.goto)); resetAutoplay(); return; }
  });

  // Carrusel
  $("#promoPrev").addEventListener("click", () => { goToSlide(slideIndex - 1); resetAutoplay(); });
  $("#promoNext").addEventListener("click", () => { goToSlide(slideIndex + 1); resetAutoplay(); });
  const promoTrack = $("#promoSlides");
  let scrollSync;
  promoTrack.addEventListener("scroll", () => {
    clearTimeout(scrollSync);
    scrollSync = setTimeout(() => {
      const i = Math.round(promoTrack.scrollLeft / promoTrack.clientWidth);
      if (i !== slideIndex && i >= 0 && i < SLIDES.length) { slideIndex = i; syncDots(); }
    }, 150);
  });

  // Búsqueda
  const search = $("#searchInput");
  search.addEventListener("input", () => {
    state.query = search.value.trim().toLowerCase();
    renderGrid();
  });
  const goSearch = () => $("#tienda").scrollIntoView({ behavior: "smooth" });
  search.addEventListener("keydown", (e) => { if (e.key === "Enter") goSearch(); });
  $("#searchBtn").addEventListener("click", goSearch);

  // Orden
  $("#sortSelect").addEventListener("change", (e) => {
    state.sort = e.target.value;
    renderGrid();
  });

  // Carrito: abrir/cerrar
  $("#cartBtn").addEventListener("click", openCart);
  $("#cartClose").addEventListener("click", closeCart);
  $("#overlay").addEventListener("click", closeCart);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeCart(); });

  // Carrito: cantidades y eliminar
  $("#cartItems").addEventListener("click", (e) => {
    const qtyBtn = e.target.closest("[data-qty]");
    if (qtyBtn) { changeQty(Number(qtyBtn.dataset.id), Number(qtyBtn.dataset.qty)); return; }
    const rmBtn = e.target.closest("[data-remove]");
    if (rmBtn) removeFromCart(Number(rmBtn.dataset.remove));
  });

  // Checkout (demo)
  $("#checkoutBtn").addEventListener("click", () => {
    if (state.cart.size === 0) { aaoToast("Tu carrito está vacío"); return; }
    aaoToast("Pedido simulado — gracias por probar All At Once");
    state.cart.clear();
    updateCartUI();
    closeCart();
  });

  // Wishlist header → página de favoritos
  $("#wishBtn").addEventListener("click", () => {
    window.location.href = "favoritos.html";
  });

  // Newsletter (demo)
  $("#newsletterForm").addEventListener("submit", (e) => {
    e.preventDefault();
    $("#newsletterForm").style.display = "none";
    $("#newsletterOk").hidden = false;
  });

  // Burger (móvil)
  $("#burger").addEventListener("click", () => {
    $("#burger").classList.toggle("is-open");
    $("#catnav").classList.toggle("is-open");
  });
}

/* ─────────── Init ─────────── */
renderPromo();
renderShelf();
renderDeals();
renderBestsellers();
renderGrid();
updateCartUI();
aaoCountdown();
bindEvents();
initReveal();
startAutoplay();

// ?cart=open → abrir el carrito al llegar (p. ej. desde otra página)
if (new URLSearchParams(location.search).get("cart") === "open") openCart();

// ?q=xyz → búsqueda heredada desde otra página
const qParam = new URLSearchParams(location.search).get("q");
if (qParam) {
  $("#searchInput").value = qParam;
  state.query = qParam.toLowerCase();
  renderGrid();
  $("#tienda").scrollIntoView({ behavior: "smooth" });
}

} /* cierre del guard de staff */
