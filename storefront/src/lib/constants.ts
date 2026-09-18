// Constantes de la tienda (fallbacks hasta que carga /api/settings)

export const FREE_SHIP_FALLBACK = 75;
export const SHIP_COST_FALLBACK = 4.99;
export const IVA_FALLBACK = 21;

// Imágenes de relleno para el shelf de categorías (mismas que la demo
// vanilla): completan las tarjetas hasta 4 celdas con "Novedades"/"Selección"
const U = (id: string) => `https://images.unsplash.com/${id}?q=80&w=800&auto=format&fit=crop`;

export const CATEGORY_EXTRAS: Record<string, string[]> = {
  Tech: [U("photo-1518770660439-4636190af475"), U("photo-1498049794561-7780e7231661")],
  Moda: [U("photo-1445205170230-053b83016050"), U("photo-1441986300917-64674bd600d8")],
  Hogar: [U("photo-1567016432779-094069958ea5"), U("photo-1524758631624-e2822e304c36")],
  Belleza: [U("photo-1596462502278-27bfdc403348"), U("photo-1571781926291-c477ebfd024b")],
  Accesorios: [U("photo-1548036328-c9fa89d128fa"), U("photo-1523170335258-f5ed11844a49")],
};
