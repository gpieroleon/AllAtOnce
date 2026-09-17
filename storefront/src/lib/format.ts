import type { Product } from "./types";

export const fmt = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

export function discount(p: Pick<Product, "price" | "old">): number {
  if (!p.old || p.old <= p.price) return 0;
  return Math.round((1 - p.price / p.old) * 100);
}

export function soldPct(p: Product): number {
  // % "vendido" en ofertas relámpago: determinista por producto
  const base = (Number(p.id) * 37 + 23) % 88;
  return Math.max(12, base);
}

export function catLabel(cat: string): string {
  const map: Record<string, string> = {
    ofertas: "Ofertas",
    all: "Todo el catálogo",
    Tech: "Tecnología",
    Tecnología: "Tecnología",
    Moda: "Moda",
    Hogar: "Hogar",
    Belleza: "Belleza",
    Accesorios: "Accesorios",
  };
  return map[cat] || cat;
}

export function deliveryDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Estimación de días de envío según producto (prime → exprés) */
export function defaultShipDays(p: Product): number {
  return p.prime ? 1 : 4;
}
