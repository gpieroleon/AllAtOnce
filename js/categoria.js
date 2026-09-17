/* ═══════════════════════════════════════════════════════════
   ALL AT ONCE — Página de sección (categoria.html)
   Ofertas / categorías / todos los productos, con breadcrumbs,
   ordenación y carrito compartido. Referencia: amazon.com.
   ═══════════════════════════════════════════════════════════ */

"use strict";

(function () {
  const $ = (sel) => document.querySelector(sel);

  const params = new URLSearchParams(location.search);
  const cat = params.get("cat") || "all";
  const isDeals = cat === "ofertas";
  const label = isDeals ? "Ofertas" : cat === "all" ? "Todos los productos" : AAO.CAT_LABELS[cat];

  // Sección desconocida
  if (!label) {
    $("#crumbCurrent").textContent = "Sección no encontrada";
    $("#pageTitle").textContent = "Esta sección no existe";
    $("#pageSub").textContent = "Vuelve a la tienda o elige una categoría del menú.";
    $("#gridEmpty").hidden = false;
    $(".shop__toolbar").style.display = "none";
    document.title = "Sección no encontrada · All At Once";
    return;
  }

  document.title = `${label} · All At Once`;
  $("#crumbCurrent").textContent = label;
  $("#pageTitle").textContent = label;
  $("#flashHero").hidden = !isDeals;
  $("#pageSub").textContent = isDeals
    ? "Ofertas relámpago con stock limitado. Cuando el contador llegue a cero, vuelven a subir."
    : cat === "all"
      ? "El catálogo completo de All At Once en un solo vistazo."
      : `Lo mejor de ${label}: seleccionado, valorado y enviado por All At Once.`;

  // Resaltar la sección activa en el menú bar
  document.querySelectorAll(".catnav__link").forEach((a) => {
    a.classList.toggle("is-active", a.dataset.nav === cat);
  });

  let sort = "featured";

  function list() {
    let l = isDeals ? AAO.PRODUCTS.filter((p) => p.deal)
      : cat === "all" ? [...AAO.PRODUCTS]
      : AAO.PRODUCTS.filter((p) => p.cat === cat);
    switch (sort) {
      case "rating":      l = [...l].sort((a, b) => b.rating - a.rating); break;
      case "price-asc":   l = [...l].sort((a, b) => a.price - b.price); break;
      case "price-desc":  l = [...l].sort((a, b) => b.price - a.price); break;
      case "discount":    l = [...l].sort((a, b) => AAO.discount(b) - AAO.discount(a)); break;
    }
    return l;
  }

  function render() {
    const l = list();
    $("#resultCount").textContent = `${l.length} resultado${l.length !== 1 ? "s" : ""}`;
    $("#gridEmpty").hidden = l.length > 0;
    if (isDeals) {
      $("#grid").innerHTML = "";
      $("#dealsWrap").hidden = false;
      $("#dealGrid").innerHTML = l.map(AAO.dealCardHTML).join("");
    } else {
      $("#dealsWrap").hidden = true;
      $("#grid").innerHTML = l.map((p, i) => AAO.productCardHTML(p, i)).join("");
    }
  }

  $("#sortSelect").addEventListener("change", (e) => { sort = e.target.value; render(); });

  // Añadir al carrito (compartido con el resto de páginas)
  document.addEventListener("click", (e) => {
    const addBtn = e.target.closest("[data-add]");
    if (addBtn) {
      AAO.CartStore.add(addBtn.dataset.add);
      AAO.syncCartBadge();
      AAO.aaoToast(`${AAO.byId(addBtn.dataset.add).name} añadido al carrito`);
      if (addBtn.classList.contains("card__add")) {
        addBtn.classList.add("is-added");
        addBtn.innerHTML = `${AAO.icon("cart")}<span>Añadido</span>`;
        setTimeout(() => {
          addBtn.classList.remove("is-added");
          addBtn.innerHTML = `${AAO.icon("cart")}<span>Añadir</span>`;
        }, 1200);
      }
    }
  });

  // Buscador → home con la búsqueda aplicada
  $("#searchForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const q = $("#searchInput").value.trim();
    if (q) window.location.href = "index.html?q=" + encodeURIComponent(q);
  });

  // Burger móvil
  $("#burger").addEventListener("click", () => {
    $("#burger").classList.toggle("is-open");
    $("#catnav").classList.toggle("is-open");
  });

  render();
  AAO.syncCartBadge();
  AAO.aaoCountdown();
})();
