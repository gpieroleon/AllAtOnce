/* ═══════════════════════════════════════════════════════════
   ALL AT ONCE — Búsqueda (buscar.html?=q)
   Referencia: ruta "/buscar" de la especificación.
   ═══════════════════════════════════════════════════════════ */

"use strict";

(function () {
  const $ = (sel) => document.querySelector(sel);
  const q = (new URLSearchParams(location.search).get("q") || "").trim();
  let sort = "featured";

  $("#searchInput").value = q;
  document.title = q ? `Resultados para “${q}” · All At Once` : "Buscar · All At Once";
  $("#searchTitle").textContent = q ? `Resultados para “${q}”` : "Busca en All At Once";
  $("#searchSub").textContent = q
    ? "Productos que coinciden con tu búsqueda en nombre, categoría o marca."
    : "Escribe en el buscador de arriba para encontrar productos.";

  function results() {
    if (!q) return [];
    const needle = q.toLowerCase();
    let list = AAO.PRODUCTS.filter((p) =>
      p.name.toLowerCase().includes(needle) ||
      p.cat.toLowerCase().includes(needle) ||
      (AAO.CAT_LABELS[p.cat] || "").toLowerCase().includes(needle)
    );
    switch (sort) {
      case "rating": list = [...list].sort((a, b) => b.rating - a.rating); break;
      case "price-asc": list = [...list].sort((a, b) => a.price - b.price); break;
      case "price-desc": list = [...list].sort((a, b) => b.price - a.price); break;
      case "discount": list = [...list].sort((a, b) => AAO.discount(b) - AAO.discount(a)); break;
    }
    return list;
  }

  function render() {
    const list = results();
    $("#resultCount").textContent = `${list.length} resultado${list.length !== 1 ? "s" : ""}`;
    $("#searchEmpty").hidden = list.length > 0;
    $("#grid").innerHTML = list.map((p, i) => AAO.productCardHTML(p, i)).join("");
  }

  document.addEventListener("click", (e) => {
    const addBtn = e.target.closest("[data-add]");
    if (addBtn) {
      AAO.CartStore.add(addBtn.dataset.add);
      AAO.syncCartBadge();
      AAO.aaoToast(`${AAO.byId(addBtn.dataset.add).name} añadido al carrito`);
    }
  });

  $("#sortSelect").addEventListener("change", (e) => { sort = e.target.value; render(); });
  $("#searchForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const nq = $("#searchInput").value.trim();
    if (nq) window.location.href = "buscar.html?q=" + encodeURIComponent(nq);
  });
  $("#burger").addEventListener("click", () => {
    $("#burger").classList.toggle("is-open");
    $("#catnav").classList.toggle("is-open");
  });

  render();
  AAO.syncCartBadge();
  AAO.aaoCountdown();
})();
