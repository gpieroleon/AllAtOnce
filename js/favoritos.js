/* ═══════════════════════════════════════════════════════════
   ALL AT ONCE — Favoritos (favoritos.html)
   Lista de deseos persistente. Referencia: sección 2.1
   "/cuenta/favoritos" de la especificación.
   ═══════════════════════════════════════════════════════════ */

"use strict";

(function () {
  const $ = (sel) => document.querySelector(sel);

  function getFavs() {
    return new Set(JSON.parse(localStorage.getItem("aao_wishlist") || "[]"));
  }
  function setFavs(set) {
    localStorage.setItem("aao_wishlist", JSON.stringify([...set]));
  }

  function render() {
    const favs = getFavs();
    const items = [...favs].map(AAO.byId).filter(Boolean);
    $("#favSub").textContent = items.length
      ? `${items.length} producto${items.length > 1 ? "s" : ""} guardado${items.length > 1 ? "s" : ""}`
      : "";
    $("#favEmpty").hidden = items.length > 0;
    $("#favGrid").innerHTML = items.map((p, i) => AAO.productCardHTML(p, i, true)).join("");
  }

  /* Corazón = quitar de favoritos */
  document.addEventListener("click", (e) => {
    const wishBtn = e.target.closest("[data-wish]");
    if (wishBtn) {
      const favs = getFavs();
      favs.delete(Number(wishBtn.dataset.wish));
      setFavs(favs);
      AAO.aaoToast("Eliminado de favoritos");
      render();
      return;
    }
    const addBtn = e.target.closest("[data-add]");
    if (addBtn) {
      AAO.CartStore.add(addBtn.dataset.add);
      AAO.syncCartBadge();
      AAO.aaoToast(`${AAO.byId(addBtn.dataset.add).name} añadido al carrito`);
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
  AAO.syncCartBadge();
  AAO.aaoCountdown();
})();
