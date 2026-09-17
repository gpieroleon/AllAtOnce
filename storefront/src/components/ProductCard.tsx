"use client";

import Link from "next/link";
import type { Product } from "@/lib/types";
import { discount, fmt, soldPct } from "@/lib/format";
import { useCart } from "@/context/CartContext";
import { Icon, Stars } from "@/components/Icon";

function badge(p: Product) {
  if (p.badge === "flash") return <span className="pill pill--off">-{discount(p)}%</span>;
  if (p.badge === "new") return <span className="pill pill--new">Nuevo</span>;
  if (p.badge === "top") return <span className="pill pill--top">Top ventas</span>;
  if (p.deal) return <span className="pill pill--off">-{discount(p)}%</span>;
  return null;
}

export function ProductCard({ p, index = 0, showWish = true }: { p: Product; index?: number; showWish?: boolean }) {
  const { add, toggleWish, isWished } = useCart();
  const wished = isWished(p.id);

  return (
    <article className="card" style={{ animationDelay: `${Math.min(index * 55, 400)}ms` }}>
      <Link className="card__media" href={`/producto/${p.id}`} style={{ background: "linear-gradient(140deg,#FF6A00,#FF3D1F)" }} aria-label={`Ver ${p.name}`}>
        {p.img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="card__img" src={p.img} alt={p.name} loading="lazy" />
        ) : (
          <Icon name="box" className="card__fallback" />
        )}
        <span className="card__badge">{badge(p)}</span>
      </Link>
      {showWish && (
        <button
          className={`card__wish ${wished ? "is-wished" : ""}`}
          onClick={() => toggleWish(p.id)}
          aria-label="Añadir a favoritos"
        >
          <Icon name="heart" />
        </button>
      )}
      <div className="card__body">
        <span className="card__cat">{p.cat}</span>
        <h3 className="card__name">
          <Link href={`/producto/${p.id}`}>{p.name}</Link>
        </h3>
        <div className="card__rating">
          <Stars rating={p.rating} />
          <span className="card__reviews">
            {p.rating} ({p.reviews.toLocaleString("es-ES")})
          </span>
        </div>
        <div className="card__foot">
          <div className="card__price">
            <strong>{fmt.format(p.price)}</strong>
            {p.old > p.price && <s>{fmt.format(p.old)}</s>}
          </div>
          <button className="card__add" onClick={() => add(p.id)} aria-label={`Añadir ${p.name} al carrito`}>
            <Icon name="cart" />
            <span>Añadir</span>
          </button>
        </div>
        {p.prime && (
          <span className="card__prime">
            <Icon name="truck" size={14} /> Envío exprés 24 h
          </span>
        )}
      </div>
    </article>
  );
}

export function DealCard({ p }: { p: Product }) {
  const { add } = useCart();
  const sold = soldPct(p);
  return (
    <article className="deal-card">
      <Link className="deal-card__media" href={`/producto/${p.id}`} style={{ background: "linear-gradient(140deg,#FF6A00,#FF3D1F)" }} aria-label={`Ver ${p.name}`}>
        {p.img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="deal-card__img" src={p.img} alt={p.name} loading="lazy" />
        ) : (
          <Icon name="box" className="deal-card__fallback" />
        )}
        <span className="deal-card__off">-{discount(p)}%</span>
      </Link>
      <div className="deal-card__body">
        <h3 className="deal-card__name">
          <Link href={`/producto/${p.id}`}>{p.name}</Link>
        </h3>
        <p className="deal-card__price">
          <strong>{fmt.format(p.price)}</strong> <s>{fmt.format(p.old)}</s>
        </p>
        <div className="deal-card__stock">
          <p>¡{sold}% vendido — queda poco stock!</p>
          <div className="deal-card__stock-bar">
            <div className="deal-card__stock-fill" style={{ width: `${sold}%` }} />
          </div>
        </div>
        <button className="btn btn--primary" onClick={() => add(p.id)}>
          <Icon name="cart" size={18} /> Añadir
        </button>
      </div>
    </article>
  );
}
