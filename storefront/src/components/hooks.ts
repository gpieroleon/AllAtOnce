"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Product } from "@/lib/types";
import { get } from "@/lib/api";

type SortKey = "featured" | "rating" | "price-asc" | "price-desc" | "discount";

export function useCatalog() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await get<Product[]>("/products?cat=all");
      setProducts(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de conexión");
      setProducts((prev) => prev ?? []);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { products, error, reload: load };
}

export function sortProducts(list: Product[], sort: SortKey): Product[] {
  const arr = [...list];
  switch (sort) {
    case "rating":
      return arr.sort((a, b) => b.rating - a.rating);
    case "price-asc":
      return arr.sort((a, b) => a.price - b.price);
    case "price-desc":
      return arr.sort((a, b) => b.price - a.price);
    case "discount":
      return arr.sort((a, b) => {
        const da = a.old > a.price ? 1 - a.price / a.old : 0;
        const db = b.old > b.price ? 1 - b.price / b.old : 0;
        return db - da;
      });
    default:
      return arr;
  }
}

export function useRowScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };
  return { ref, scroll };
}
