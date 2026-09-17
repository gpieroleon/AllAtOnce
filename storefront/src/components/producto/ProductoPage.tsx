"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Product, ReviewsResponse } from "@/lib/types";
import { get } from "@/lib/api";
import { catLabel, defaultShipDays, deliveryDate, discount, fmt } from "@/lib/format";
import { useCart } from "@/context/CartContext";
import { Icon, Stars } from "@/components/Icon";
import { CoverImg } from "@/components/CoverImg";
import { ProductCard } from "@/components/ProductCard";

export default function ProductoPage({ id }: { id: string }) {
  const router = useRouter();
  const { add, setDrawerOpen } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [missing, setMissing] = useState(false);
  const [reviews, setReviews] = useState<ReviewsResponse | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [together, setTogether] = useState<Product[]>([]);
  const [imgIndex, setImgIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [qty, setQty] = useState(1);
  const [talla, setTalla] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [checked, setChecked] = useState<Set<number>>(new Set());

  useEffect(() => {
    setProduct(null);
    setMissing(false);
    setImgIndex(0);
    setTalla(null);
    setColor(null);
    setQty(1);
    setChecked(new Set());

    get<Product>(`/products/${encodeURIComponent(id)}`)
      .then((p) => {
        setProduct(p);
        get<ReviewsResponse>(`/products/${p.id}/reviews`).then(setReviews).catch(() => setReviews({ avg: p.rating, total: 0, list: [] }));
        get<Product[]>(`/products?cat=${encodeURIComponent(p.cat)}`)
          .then((list) => {
            setRelated(list.filter((x) => x.id !== p.id).slice(0, 4));
            setTogether(list.filter((x) => x.id !== p.id).slice(0, 3));
          })
          .catch(() => {
            setRelated([]);
            setTogether([]);
          });
      })
      .catch(() => setMissing(true));
  }, [id]);

  const variantes = useMemo(() => product?.variantes ?? [], [product]);
  const tallas = useMemo(
    () => (variantes.length ? [...new Set(variantes.map((v) => v.talla).filter(Boolean))] as string[] : []),
    [variantes]
  );
  const colores = useMemo(
    () => (variantes.length ? [...new Set(variantes.map((v) => v.color).filter(Boolean))] as string[] : []),
    [variantes]
  );

  const comboStock = useMemo(() => {
    if (!variantes.length) return product?.stock ?? 0;
    const match = variantes.find(
      (v) =>
        (talla === null || v.talla === talla) &&
        (color === null || v.color === color)
    );
    return match?.stock ?? 0;
  }, [variantes, talla, color, product]);

  const variantReady = !variantes.length || comboStock > 0 || (talla !== null || color !== null);

  const images = useMemo(() => {
    if (!product) return [];
    return product.imagenes?.length ? product.imagenes : product.img ? [product.img] : [];
  }, [product]);

  if (missing) {
    return (
      <div className="container pd__missing">
        <h1>Producto no encontrado</h1>
        <p>Es posible que se haya agotado o ya no esté disponible.</p>
        <Link className="btn btn--primary" href="/categoria/all">
          Ver catálogo completo
        </Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container page">
        <p className="grid__empty">Cargando producto…</p>
      </div>
    );
  }

  const off = discount(product);
  const shipDays = defaultShipDays(product);
  const lowStock = (variantes.length ? comboStock : product.stock) > 0 && (variantes.length ? comboStock : product.stock) <= 5;
  const outOfStock = (variantes.length ? comboStock : product.stock) <= 0;

  const histogram = reviews
    ? [5, 4, 3, 2, 1].map((star) => ({
        star,
        count: reviews.list.filter((r) => r.rating === star).length,
      }))
    : [];

  const togetherTotal =
    product.price +
    together.filter((p) => checked.has(p.id)).reduce((sum, p) => sum + p.price, 0);
  const togetherCount = 1 + [...checked].filter((cid) => together.some((p) => p.id === cid)).length;

  const toggleTogether = (pid: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(pid)) next.delete(pid);
      else next.add(pid);
      return next;
    });
  };

  const addSelected = () => {
    add(product.id, qty, true);
    together.filter((p) => checked.has(p.id)).forEach((p) => add(p.id, 1, true));
    setDrawerOpen(true);
  };

  return (
    <div className="container pd">
      <nav className="crumbs" aria-label="Migas de pan">
        <Link href="/">Inicio</Link>
        <span aria-hidden="true">›</span>
        <Link href={`/categoria/${encodeURIComponent(product.cat)}`}>{catLabel(product.cat)}</Link>
        <span aria-hidden="true">›</span>
        <span>{product.name}</span>
      </nav>

      <div className="pd__main">
        {/* Galería */}
        <div className="pd__gallery">
          {images.length > 1 && (
            <div className="pd__thumbs">
              {images.map((src, i) => (
                <button
                  key={src + i}
                  className={`pd__thumb ${i === imgIndex ? "is-active" : ""}`}
                  onClick={() => {
                    setImgIndex(i);
                    setZoomed(false);
                  }}
                  aria-label={`Imagen ${i + 1}`}
                >
                  <CoverImg src={src} alt="" />
                </button>
              ))}
            </div>
          )}
          <div
            className={`pd__stage ${zoomed ? "is-zoomed" : ""}`}
            onClick={() => setZoomed((v) => !v)}
            style={{ background: "linear-gradient(140deg,#FF6A00,#FF3D1F)" }}
          >
            {images.length > 0 ? (
              <CoverImg className="pd__img" src={images[imgIndex]} alt={product.name} />
            ) : (
              <Icon name="box" className="pd__fallback" />
            )}
          </div>
        </div>

        {/* Info central */}
        <div className="pd__info">
          <h1 className="pd__title">{product.name}</h1>
          <p className="pd__meta">
            Marca: <Link href="/categoria/all">All At Once</Link>
            {product.sku && <> · SKU: {product.sku}</>}
          </p>

          <div className="pd__rating">
            <Stars rating={product.rating} size={16} />
            <a href="#opiniones">
              {reviews?.total ?? product.reviews} valoraciones
            </a>
          </div>

          <hr className="pd__divider" />

          <div className="pd__price-row">
            {off > 0 && <span className="pd__off">-{off}%</span>}
            <span className="pd__price">{fmt.format(product.price)}</span>
            {product.old > product.price && <span className="pd__old">Precio recomendado: {fmt.format(product.old)}</span>}
          </div>
          <p className="pd__vat">IVA incluido · envío calculado al tramitar el pedido</p>

          <p className="pd__delivery">
            <Icon name="truck" />
            <span>
              <strong>{product.prime ? "Entrega exprés" : "Entrega estimada"}: {deliveryDate(shipDays)}</strong>
              <small>{product.prime ? "Envío prioritario 24 h con seguimiento" : "Envío estándar con seguimiento"}</small>
            </span>
          </p>

          {variantes.length > 0 && (
            <div className="pd__variants">
              <h3>Opciones disponibles</h3>
              {tallas.length > 0 && (
                <>
                  <p className="pd__optlabel">Talla{talla ? `: ${talla}` : ""}</p>
                  <div className="pd__sizes">
                    {tallas.map((t) => (
                      <button
                        key={t}
                        className={`pd__size ${talla === t ? "is-active" : ""}`}
                        onClick={() => setTalla(t === talla ? null : t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </>
              )}
              {colores.length > 0 && (
                <>
                  <p className="pd__optlabel">Color{color ? `: ${color}` : ""}</p>
                  <div className="pd__colors">
                    {colores.map((c) => (
                      <button
                        key={c}
                        className={`pd__color ${color === c ? "is-active" : ""}`}
                        style={{ background: c }}
                        onClick={() => setColor(c === color ? null : c)}
                        aria-label={`Color ${c}`}
                        title={c}
                      />
                    ))}
                  </div>
                </>
              )}
              <p className="pd__varstock" style={comboStock === 0 ? { color: "var(--accent-dark)" } : undefined}>
                {variantReady
                  ? comboStock > 0
                    ? `${comboStock} unidades disponibles para la combinación seleccionada`
                    : variantes.length
                      ? "Selecciona una combinación para ver el stock"
                      : ""
                  : "Sin stock para esa combinación"}
              </p>
            </div>
          )}

          {product.feats?.length > 0 && (
            <ul className="pd__feats">
              {product.feats.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          )}
        </div>

        {/* Caja de compra */}
        <aside className="pd__buy">
          <p className="pd__buy-price">{fmt.format(product.price)}</p>
          <p className="pd__buy-delivery">
            <strong>Entrega {product.prime ? "exprés" : "estimada"}: {deliveryDate(shipDays)}</strong>
          </p>
          <p className="pd__buy-where">En stock · envío desde Madrid, ES</p>

          <p className={`pd__stock ${lowStock ? "is-low" : ""}`} style={outOfStock ? { color: "var(--accent-dark)" } : undefined}>
            {outOfStock
              ? "Agotado temporalmente"
              : lowStock
                ? `¡Solo quedan ${variantes.length ? comboStock : product.stock} unidades!`
                : "En stock"}
          </p>

          <div className="pd__qty">
            <label htmlFor="qty">Cantidad:</label>
            <select id="qty" value={qty} onChange={(e) => setQty(Number(e.target.value))}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <button className="btn btn--primary" disabled={outOfStock} onClick={() => add(product.id, qty)}>
            <Icon name="cart" size={18} /> Añadir a la cesta
          </button>
          <button
            className="btn btn--buy"
            disabled={outOfStock}
            onClick={() => {
              add(product.id, qty, true);
              router.push("/checkout");
            }}
          >
            Comprar ahora
          </button>
          <p className="pd__secure">
            <Icon name="shield" size={14} /> Transacción segura · devoluciones gratis 30 días
          </p>
        </aside>
      </div>

      {/* Descripción + specs */}
      {(product.descLarga || Object.keys(product.specs ?? {}).length > 0) && (
        <div className="pd__desc">
          {product.descLarga && (
            <>
              <h2>Descripción del producto</h2>
              <p className="pd__desc-text">{product.descLarga}</p>
            </>
          )}
          {Object.keys(product.specs ?? {}).length > 0 && (
            <dl className="pd__specs">
              {Object.entries(product.specs).map(([k, v]) => (
                <div className="pd__spec-row" key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}

      {/* Frecuentemente comprados juntos */}
      {together.length > 0 && (
        <section className="together" aria-label="Frecuentemente comprados juntos">
          <h2>Frecuentemente comprados juntos</h2>
          <div className="together__layout">
            <div className="together__items">
              <div className="together__item">
                <span className="together__tag">Este artículo: {product.name}</span>
                <Link className="together__media" href={`/producto/${product.id}`} style={{ background: "linear-gradient(140deg,#FF6A00,#FF3D1F)" }}>
                  {product.img ? (
                    <CoverImg src={product.img} alt={product.name} />
                  ) : (
                    <Icon name="box" className="together__fallback" />
                  )}
                </Link>
                <p className="together__price">{fmt.format(product.price)}</p>
              </div>
              {together.map((p) => (
                <div className="together__item" key={p.id}>
                  <label className="together__check">
                    <input
                      type="checkbox"
                      checked={checked.has(p.id)}
                      onChange={() => toggleTogether(p.id)}
                      aria-label={`Añadir ${p.name}`}
                    />
                  </label>
                  <span className="together__tag">{p.name}</span>
                  <Link className="together__media" href={`/producto/${p.id}`} style={{ background: "linear-gradient(140deg,#7C3AED,#4F46E5)" }}>
                    {p.img ? (
                      <CoverImg src={p.img} alt={p.name} />
                    ) : (
                      <Icon name="box" className="together__fallback" />
                    )}
                  </Link>
                  <span className="together__name">
                    <Link href={`/producto/${p.id}`}>{p.name}</Link>
                  </span>
                  <Stars rating={p.rating} />
                  <p className="together__price">{fmt.format(p.price)}</p>
                </div>
              ))}
            </div>
            <div className="together__summary">
              <p className="together__total-label">Total para {togetherCount} artículo{togetherCount > 1 ? "s" : ""}:</p>
              <p className="together__total">{fmt.format(togetherTotal)}</p>
              <button className="btn btn--primary together__addall" disabled={outOfStock} onClick={addSelected}>
                <Icon name="cart" size={18} /> Añadir {togetherCount} a la cesta
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Opiniones */}
      <section className="pd__reviews" id="opiniones" aria-label="Opiniones de clientes">
        <h2>Opiniones de clientes</h2>
        <div className="pd__rev-layout">
          <div>
            <p className="pd__rev-big">{reviews ? reviews.avg.toFixed(1) : product.rating.toFixed(1)}</p>
            <Stars rating={reviews?.avg ?? product.rating} size={16} />
            <p className="pd__rev-count">
              Basado en {reviews?.total ?? product.reviews} valoraciones
            </p>
            <div className="pd__bars">
              {histogram.map((h) => (
                <div className="pd__bar" key={h.star}>
                  <span>{h.star} estrellas</span>
                  <div className="pd__bar-track">
                    <div
                      className="pd__bar-fill"
                      style={{
                        width: reviews && reviews.list.length ? `${(h.count / reviews.list.length) * 100}%` : "0%",
                      }}
                    />
                  </div>
                  <b>{h.count}</b>
                </div>
              ))}
            </div>
          </div>
          <div className="pd__rev-list">
            {(reviews?.list ?? []).map((r, i) => (
              <article className="pd__rev" key={i}>
                <div className="pd__rev-head">
                  <span className="pd__rev-avatar">{r.name.charAt(0)}</span>
                  <div>
                    <p className="pd__rev-name">{r.name}</p>
                    <p className="pd__rev-date">{r.date}</p>
                  </div>
                  {r.verified && (
                    <span className="pd__rev-verified">
                      <Icon name="check" size={13} /> Compra verificada
                    </span>
                  )}
                </div>
                <Stars rating={r.rating} />
                <p className="pd__rev-title">{r.title}</p>
                <p className="pd__rev-text">{r.text}</p>
              </article>
            ))}
            {reviews && reviews.list.length === 0 && (
              <p className="pd__rev-text">Todavía no hay opiniones para este producto.</p>
            )}
          </div>
        </div>
      </section>

      {/* Relacionados */}
      {related.length > 0 && (
        <section className="pd__related" aria-label="Productos relacionados">
          <h2>Productos relacionados</h2>
          <div className="grid">
            {related.map((p, i) => (
              <ProductCard p={p} index={i} key={p.id} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
