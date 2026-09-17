"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { ProductCard } from "@/components/ProductCard";
import { Icon } from "@/components/Icon";

export default function FavoritosPage() {
  const { wishlist, catalog, catalogReady } = useCart();
  const products = wishlist.map((id) => catalog[id]).filter(Boolean);

  return (
    <div className="page">
      <div className="container">
        <nav className="crumbs" aria-label="Migas de pan">
          <Link href="/">Inicio</Link>
          <span aria-hidden="true">›</span>
          <span>Favoritos</span>
        </nav>

        <div className="page-head">
          <h1>Tus favoritos {wishlist.length > 0 && `(${wishlist.length})`}</h1>
          <p>Guardados en este navegador. Añádelos a la cesta cuando quieras.</p>
        </div>

        {!catalogReady ? (
          <p className="grid__empty">Cargando…</p>
        ) : products.length === 0 ? (
          <div className="box" style={{ textAlign: "center", padding: "48px 24px" }}>
            <span style={{ color: "var(--accent)", display: "inline-block" }}>
              <Icon name="heart" size={56} />
            </span>
            <h2 style={{ fontFamily: "var(--font-display)", marginTop: 14 }}>Aún no tienes favoritos</h2>
            <p style={{ color: "var(--ink-soft)", margin: "10px 0 20px" }}>
              Toca el corazón de cualquier producto para guardarlo aquí.
            </p>
            <Link className="btn btn--primary" href="/categoria/all">
              Descubrir productos
            </Link>
          </div>
        ) : (
          <div className="grid">
            {products.map((p, i) => (
              <ProductCard p={p} index={i} key={p.id} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
