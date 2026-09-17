// Persistencia local: carrito, favoritos, direcciones.
//
// DECISIÓN DE FORMATO DEL CARRITO:
// "aao_cart" guarda un objeto JSON { [productId: string]: cantidad }
// p. ej. { "1": 2, "7": 1 }. Se eligió objeto por búsqueda O(1) y
// serialización directa; las claves son strings (JSON) y se convierten
// a número al usarlas.

export type CartMap = Record<string, number>;

export function loadCart(): CartMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem("aao_cart");
    if (!raw) return {};
    const data = JSON.parse(raw);
    if (data && typeof data === "object" && !Array.isArray(data)) return data as CartMap;
    return {};
  } catch {
    return {};
  }
}

export function saveCart(cart: CartMap): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("aao_cart", JSON.stringify(cart));
}

export function cartCount(cart: CartMap): number {
  return Object.values(cart).reduce((a, b) => a + b, 0);
}

// ── Wishlist ────────────────────────────────────────────────
export function loadWishlist(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("aao_wishlist");
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data.map(Number) : [];
  } catch {
    return [];
  }
}

export function saveWishlist(ids: number[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("aao_wishlist", JSON.stringify(ids));
}

// ── Direcciones (no hay endpoint: se guardan en local) ──────
export interface StoredAddress {
  id: string;
  nombre: string;
  direccion: string;
  ciudad: string;
  provincia: string;
  cp: string;
  pais: string;
  telefono: string;
  predeterminada?: boolean;
}

export function loadAddresses(): StoredAddress[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("aao_addresses");
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function saveAddresses(list: StoredAddress[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("aao_addresses", JSON.stringify(list));
}
