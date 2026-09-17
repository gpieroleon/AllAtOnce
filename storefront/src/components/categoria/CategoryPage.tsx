"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Category, Product } from "@/lib/types";
import { get } from "@/lib/api";
import { catLabel } from "@/lib/format";
import { sortProducts } from "@/components/hooks";
import { CountdownBoxes } from "@/components/Countdown";
import { ProductCard } from "@/components/ProductCard";

type SortKey = "featured" | "rating" | "price-asc" | "price-desc" | "discount";

export default function CategoryPage({ cat }: { cat: string }) {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sort, setSort] = useState<SortKey>("featured");
  const isOfertas = cat.toLowerCase() === "ofertas";

  useEffect(() => {
    get<Category[]>("/categories").then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setProducts(null);
    const query = cat === "all" ? "all" : cat;
    get<Product[]>(`/products?cat=${encodeURIComponent(query)}`)
      .then(setProducts)
      .catch(() => setProducts([]));
  }, [cat]);

  const known =
    cat === "all" ||
    isOfertas ||
    categories.some((c) => c.name.toLowerCase() === cat.toLowerCase());

  const sorted = useMemo(() => sortProducts(products ?? [], sort), [products, sort]);
  const title = isOfertas ? "Ofertas flash" : cat === "all" ? "Todo el catálogo" : catLabel(cat);

  return (
    <div className="page">
      {isOfertas && (
        <section className="flash-hero">
          <div className="container flash-hero__inner">
            <span className="pill pill--off">Hasta -50%</span>
            <h1 className="flash-hero__title">
              Ofertas que <em>desaparecen</em> a medianoche
            </h1>
            <CountdownBoxes big />
            <p className="flash-hero__sub">
              Stock limitado y precios mínimos garantizados. Cuando el contador llegue a cero, vuelven a su precio original.
            </p>
          </div>
        </section>
      )}

      <div className="container" style={{ paddingTop: isOfertas ? 36 : undefined }}>
        <nav className="crumbs" aria-label="Migas de pan">
          <Link href="/">Inicio</Link>
          <span aria-hidden="true">›</span>
          <span>{title}</span>
        </nav>

        <div className="page-head">
          <h1>{title}</h1>
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
          <p className="grid__empty">Cargando productos…</p>
        ) : products.length === 0 ? (
          <div className="grid__empty">
            <p>{known ? "No hay productos en esta sección por ahora." : `No existe la sección «${cat}».`}</p>
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
