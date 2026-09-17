"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Product } from "@/lib/types";
import { get } from "@/lib/api";
import { sortProducts } from "@/components/hooks";
import { ProductCard } from "@/components/ProductCard";

type SortKey = "featured" | "rating" | "price-asc" | "price-desc" | "discount";

export default function BuscarPage() {
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const [products, setProducts] = useState<Product[] | null>(null);
  const [sort, setSort] = useState<SortKey>("featured");

  useEffect(() => {
    setProducts(null);
    get<Product[]>(`/products?cat=all${q ? `&q=${encodeURIComponent(q)}` : ""}`)
      .then(setProducts)
      .catch(() => setProducts([]));
  }, [q]);

  const sorted = useMemo(() => sortProducts(products ?? [], sort), [products, sort]);

  return (
    <div className="page">
      <div className="container">
        <nav className="crumbs" aria-label="Migas de pan">
          <Link href="/">Inicio</Link>
          <span aria-hidden="true">›</span>
          <span>Búsqueda</span>
        </nav>

        <div className="page-head">
          <h1>{q ? `Resultados para «${q}»` : "Buscar"}</h1>
          {products !== null && (
            <p className="result-count">
              {products.length} resultado{products.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        <div className="shop__toolbar">
          <span />
          <select
            className="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            aria-label="Ordenar resultados"
          >
            <option value="featured">Destacados</option>
            <option value="rating">Mejor valorados</option>
            <option value="price-asc">Precio: de menor a mayor</option>
            <option value="price-desc">Precio: de mayor a menor</option>
            <option value="discount">Mayor descuento</option>
          </select>
        </div>

        {products === null ? (
          <p className="grid__empty">Buscando…</p>
        ) : products.length === 0 ? (
          <div className="grid__empty">
            <p>No encontramos nada para «{q}». Prueba con otras palabras.</p>
            <Link className="btn btn--primary" href="/categoria/all" style={{ marginTop: 16 }}>
              Ver todo el catálogo
            </Link>
          </div>
        ) : (
          <div className="grid">
            {sorted.map((p, i) => (
              <ProductCard p={p} index={i} key={p.id} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
