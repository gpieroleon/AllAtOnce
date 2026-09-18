"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Category, Product } from "@/lib/types";
import { get } from "@/lib/api";
import { CATEGORY_EXTRAS } from "@/lib/constants";
import { useCatalog, sortProducts } from "@/components/hooks";
import { CountdownBoxes } from "@/components/Countdown";
import { DealCard, ProductCard } from "@/components/ProductCard";
import { Icon } from "@/components/Icon";
import { CoverImg } from "@/components/CoverImg";

const SLIDES = [
  {
    eyebrow: "Venta flash · hasta -50%",
    title: "Todo en tecnología, al mejor precio",
    sub: "Auriculares, smartwatches y altavoces con envío exprés y 2 años de garantía.",
    cta: "Ver ofertas flash",
    href: "/categoria/ofertas",
    img: "https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=1600&auto=format&fit=crop",
  },
  {
    eyebrow: "Nueva colección",
    title: "Moda que llega volando",
    sub: "Las zapatillas y chaquetas más vendidas, listas para salir hoy mismo.",
    cta: "Descubrir moda",
    href: "/categoria/Moda",
    img: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1600&auto=format&fit=crop",
  },
  {
    eyebrow: "Hogar & deco",
    title: "Renueva tu espacio",
    sub: "Lámparas, cerámica y detalles que convierten una casa en tu casa.",
    cta: "Ver hogar",
    href: "/categoria/Hogar",
    img: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=1600&auto=format&fit=crop",
  },
];

function HeroCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval>>();

  const goTo = (i: number) => {
    const next = (i + SLIDES.length) % SLIDES.length;
    setIndex(next);
    trackRef.current?.scrollTo({ left: next * trackRef.current.clientWidth, behavior: "smooth" });
  };

  useEffect(() => {
    timer.current = setInterval(() => goTo(index + 1), 6000);
    return () => clearInterval(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  return (
    <section className="promo" aria-label="Promociones destacadas">
      <div className="promo__slides" ref={trackRef}>
        {SLIDES.map((s, i) => (
          <div className="promo__slide" key={s.title}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="promo__img" src={s.img} alt="" loading={i > 0 ? "lazy" : undefined} />
            <div className="promo__overlay" />
            <div className="container promo__content">
              <span className="pill pill--hot">{s.eyebrow}</span>
              <h2 className="promo__title">{s.title}</h2>
              <p className="promo__sub">{s.sub}</p>
              <Link className="btn btn--primary btn--lg promo__cta" href={s.href}>
                {s.cta} <Icon name="arrow" />
              </Link>
            </div>
          </div>
        ))}
      </div>
      <button className="promo__arrow promo__arrow--prev" onClick={() => goTo(index - 1)} aria-label="Anterior">
        <Icon name="chevL" />
      </button>
      <button className="promo__arrow promo__arrow--next" onClick={() => goTo(index + 1)} aria-label="Siguiente">
        <Icon name="chevR" />
      </button>
      <div className="promo__dots">
        {SLIDES.map((s, i) => (
          <button
            key={s.title}
            className={`promo__dot ${i === index ? "is-active" : ""}`}
            onClick={() => goTo(i)}
            aria-label={`Ir a la promoción ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}

function CategoryShelf({ products }: { products: Product[] }) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    get<Category[]>("/categories").then(setCategories).catch(() => setCategories([]));
  }, []);

  const quads = categories.slice(0, 4);

  return (
    <section className="shelf" aria-label="Comprar por categoría">
      <div className="container shelf__grid">
        {quads.map((c) => {
          const items = products.filter((p) => p.cat === c.name || p.cats?.includes(c.name));
          const cells = items.slice(0, 4);
          const extras = (CATEGORY_EXTRAS[c.name] ?? []).slice(0, 4 - cells.length);
          return (
            <div className="quad" key={c.name}>
              <h3>{c.label}</h3>
              <div className="quad__grid">
                {cells.map((p) => (
                  <Link className="quad__cell" href={`/categoria/${encodeURIComponent(c.name)}`} key={p.id}>
                    <CoverImg src={p.img} alt={p.name} loading="lazy" />
                    <span>{p.name.split(" ").slice(0, 2).join(" ")}</span>
                  </Link>
                ))}
                {extras.map((img, i) => (
                  <Link className="quad__cell" href={`/categoria/${encodeURIComponent(c.name)}`} key={img}>
                    <CoverImg src={img} alt={i === 0 ? "Novedades" : "Selección"} loading="lazy" />
                    <span>{i === 0 ? "Novedades" : "Selección"}</span>
                  </Link>
                ))}
                {cells.length === 0 && extras.length === 0 && (
                  <Link className="quad__cell" href={`/categoria/${encodeURIComponent(c.name)}`}>
                    <span>{c.label}</span>
                  </Link>
                )}
              </div>
              <Link className="quad__link" href={`/categoria/${encodeURIComponent(c.name)}`}>
                Descubrir más <Icon name="arrow" />
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function HomePage() {
  const { products, error } = useCatalog();
  const [cat, setCat] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"featured" | "rating" | "price-asc" | "price-desc" | "discount">("featured");
  const dealsRef = useRef<HTMLDivElement>(null);
  const bestRef = useRef<HTMLDivElement>(null);

  const list = useMemo(() => products ?? [], [products]);
  const deals = useMemo(() => list.filter((p) => p.deal), [list]);
  const best = useMemo(() => [...list].sort((a, b) => b.reviews - a.reviews).slice(0, 8), [list]);
  const cats = useMemo(() => ["all", ...new Set(list.map((p) => p.cat))], [list]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = list.filter(
      (p) => (cat === "all" || p.cat === cat) && (!q || p.name.toLowerCase().includes(q))
    );
    return sortProducts(filtered, sort);
  }, [list, cat, query, sort]);

  const scrollBy = (ref: React.RefObject<HTMLDivElement>, dir: number) => {
    ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <>
      <HeroCarousel />
      <CategoryShelf products={list} />

      <section className="section deals" aria-label="Ofertas relámpago">
        <div className="container">
          <div className="deals__head">
            <div>
              <h2 className="section__title section__title--light">Ofertas relámpago</h2>
              <p className="section__sub section__sub--light">Precios que desaparecen a medianoche</p>
            </div>
            <div className="deals__right">
              <div className="deals__timer">
                <span>Termina en</span>
                <CountdownBoxes />
              </div>
              <div className="deals__nav">
                <button className="rowarrow rowarrow--dark" onClick={() => scrollBy(dealsRef, -1)} aria-label="Anteriores ofertas">
                  <Icon name="chevL" />
                </button>
                <button className="rowarrow rowarrow--dark" onClick={() => scrollBy(dealsRef, 1)} aria-label="Más ofertas">
                  <Icon name="chevR" />
                </button>
              </div>
            </div>
          </div>
          {error && <p className="section__sub section__sub--light">No se pudo conectar con la API: {error}</p>}
          <div className="deals__track" ref={dealsRef}>
            {deals.map((p) => (
              <DealCard p={p} key={p.id} />
            ))}
            {products && deals.length === 0 && (
              <p className="section__sub section__sub--light">No hay ofertas activas en este momento.</p>
            )}
          </div>
        </div>
      </section>

      <section className="section bestsellers" aria-label="Los más vendidos">
        <div className="container">
          <div className="bestsellers__head">
            <div>
              <h2 className="section__title">Los más vendidos</h2>
              <p className="section__sub">Lo que todo el mundo está comprando ahora</p>
            </div>
            <div className="rows__nav">
              <button className="rowarrow" onClick={() => scrollBy(bestRef, -1)} aria-label="Anteriores">
                <Icon name="chevL" />
              </button>
              <button className="rowarrow" onClick={() => scrollBy(bestRef, 1)} aria-label="Siguientes">
                <Icon name="chevR" />
              </button>
            </div>
          </div>
          <div className="rows" ref={bestRef}>
            {best.map((p, i) => (
              <ProductCard p={p} index={i} key={p.id} />
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="tienda" aria-label="Descubre más">
        <div className="container">
          <div className="section__head">
            <h2 className="section__title">Descubre más</h2>
            <p className="section__sub">Filtra, ordena y encuentra tu próxima compra</p>
          </div>

          <div className="shop__toolbar">
            <div className="chips" role="tablist" aria-label="Filtrar por categoría">
              {cats.map((c) => (
                <button
                  key={c}
                  className={`chip ${cat === c ? "is-active" : ""}`}
                  onClick={() => setCat(c)}
                >
                  {c === "all" ? "Todo" : c}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <input
                className="sort"
                style={{ minWidth: 220 }}
                type="search"
                placeholder="Buscar en resultados…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Buscar en resultados"
              />
              <select className="sort" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} aria-label="Ordenar">
                <option value="featured">Destacados</option>
                <option value="rating">Mejor valorados</option>
                <option value="price-asc">Precio: de menor a mayor</option>
                <option value="price-desc">Precio: de mayor a menor</option>
                <option value="discount">Mayor descuento</option>
              </select>
            </div>
          </div>

          {products === null ? (
            <p className="grid__empty">Cargando productos…</p>
          ) : visible.length === 0 ? (
            <p className="grid__empty">No hay productos que coincidan con tu búsqueda.</p>
          ) : (
            <div className="grid">
              {visible.map((p, i) => (
                <ProductCard p={p} index={i} key={p.id} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
