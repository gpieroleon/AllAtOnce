"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { get, post } from "@/lib/api";
import { fmt } from "@/lib/format";
import { FREE_SHIP_FALLBACK, IVA_FALLBACK } from "@/lib/constants";
import type { CouponValidation } from "@/lib/types";
import { useCart } from "@/context/CartContext";
import { Icon } from "@/components/Icon";
import { CoverImg } from "@/components/CoverImg";

export default function CarritoPage() {
  const { lines, subtotal, count, setQty, remove, toggleWish } = useCart();
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<CouponValidation | null>(null);
  const [couponErr, setCouponErr] = useState<string | null>(null);
  const [iva, setIva] = useState(IVA_FALLBACK);

  useEffect(() => {
    get<{ iva: number }>("/settings")
      .then((s) => setIva(s.iva))
      .catch(() => {});
  }, []);

  const discount = coupon?.ok ? (coupon.amount ?? 0) : 0;
  const withDiscount = subtotal - discount;
  const freeShip = withDiscount >= FREE_SHIP_FALLBACK;
  const shipping = lines.length === 0 ? 0 : freeShip ? 0 : 4.99;
  const total = withDiscount + shipping;
  const baseImponible = total / (1 + iva / 100);

  const applyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponErr(null);
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    try {
      const res = await post<CouponValidation>("/coupons/validate", { code, subtotal });
      if (res.ok) {
        setCoupon(res);
        localStorage.setItem("aao_coupon", JSON.stringify({ code: res.code, amount: res.amount }));
      } else {
        setCoupon(null);
        setCouponErr("El código no es válido o no se puede aplicar a este pedido.");
        localStorage.removeItem("aao_coupon");
      }
    } catch {
      setCouponErr("No se pudo validar el cupón. Inténtalo de nuevo.");
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    setCouponInput("");
    localStorage.removeItem("aao_coupon");
  };

  return (
    <div className="page">
      <div className="container">
        <nav className="crumbs" aria-label="Migas de pan">
          <Link href="/">Inicio</Link>
          <span aria-hidden="true">›</span>
          <span>Cesta</span>
        </nav>

        <div className="page-head">
          <h1>Tu cesta {count > 0 && `(${count})`}</h1>
        </div>

        {lines.length === 0 ? (
          <div className="box" style={{ textAlign: "center", padding: "48px 24px" }}>
            <Icon name="cart" size={56} className="pd__fallback" />
            <h2>Tu carrito está vacío</h2>
            <p style={{ color: "var(--ink-soft)", margin: "10px 0 20px" }}>
              Explora ofertas y productos destacados para empezar.
            </p>
            <Link className="btn btn--primary" href="/categoria/ofertas">
              Explorar ofertas
            </Link>
          </div>
        ) : (
          <div className="cart-layout">
            <div className="box">
              {lines.map((l) => (
                <div className="cart-item" key={l.id}>
                  <Link
                    className="cart-item__media"
                    href={`/producto/${l.id}`}
                    style={{ background: "linear-gradient(140deg,#FF6A00,#FF3D1F)" }}
                  >
                    {l.product?.img ? (                      <CoverImg src={l.product.img} alt={l.product.name} />
                    ) : (
                      <Icon name="box" />
                    )}
                  </Link>
                  <div>
                    <Link className="cart-item__name" href={`/producto/${l.id}`}>
                      {l.product?.name || `Producto #${l.id}`}
                    </Link>
                    <p className="cart-item__variant">
                      {l.product?.prime ? "Envío exprés 24 h" : "Envío estándar"}
                    </p>
                    <div className="cart-item__actions">
                      <div className="citem__qty">
                        <button onClick={() => setQty(l.id, l.qty - 1)} aria-label="Quitar uno">
                          −
                        </button>
                        <span>{l.qty}</span>
                        <button onClick={() => setQty(l.id, l.qty + 1)} aria-label="Añadir uno">
                          +
                        </button>
                      </div>
                      <button
                        className="link-btn"
                        onClick={() => {
                          toggleWish(l.id);
                          remove(l.id);
                        }}
                      >
                        Mover a favoritos
                      </button>
                      <button className="link-btn" style={{ color: "var(--accent-dark)" }} onClick={() => remove(l.id)}>
                        Eliminar
                      </button>
                    </div>
                  </div>
                  <div className="cart-item__right">
                    <span className="cart-item__price">
                      {l.product ? fmt.format(l.product.price * l.qty) : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <aside>
              <div className="box">
                <h2>Resumen del pedido</h2>
                <div className="summary-row">
                  <span>Subtotal ({count} artículo{count > 1 ? "s" : ""})</span>
                  <span className="num">{fmt.format(subtotal)}</span>
                </div>
                {coupon?.ok && (
                  <div className="summary-row" style={{ color: "var(--green)" }}>
                    <span>
                      Cupón {coupon.code}{" "}
                      <button className="link-btn" onClick={removeCoupon} aria-label="Quitar cupón">
                        (quitar)
                      </button>
                    </span>
                    <span className="num">-{fmt.format(discount)}</span>
                  </div>
                )}
                <div className="summary-row">
                  <span>Envío</span>
                  <span className="num">{freeShip ? <span className="free">Gratis</span> : fmt.format(shipping)}</span>
                </div>
                <div className="summary-row summary-row--total">
                  <span>Total (IVA incluido)</span>
                  <strong>{fmt.format(total)}</strong>
                </div>
                <p className="summary-note">
                  IVA ({iva}%): {fmt.format(total - baseImponible)} ·{" "}
                  {!freeShip && `te faltan ${fmt.format(FREE_SHIP_FALLBACK - withDiscount)} para el envío gratis`}
                  {freeShip && "envío gratis aplicado"}
                </p>
                <Link className="btn btn--primary btn--block" href="/checkout" style={{ marginTop: 12 }}>
                  Tramitar pedido
                </Link>
              </div>

              <div className="box" style={{ marginTop: 16 }}>
                <h2>Cupón de descuento</h2>
                {coupon?.ok ? (
                  <div className="coupon-ok">
                    <span>
                      {coupon.code} aplicado · {coupon.label}
                    </span>
                    <button className="link-btn" onClick={removeCoupon}>
                      Quitar
                    </button>
                  </div>
                ) : (
                  <form className="coupon" onSubmit={applyCoupon}>
                    <input
                      placeholder="AAAA00"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      aria-label="Código de cupón"
                    />
                    <button className="btn btn--outline btn--sm" type="submit">
                      Aplicar
                    </button>
                  </form>
                )}
                {couponErr && <p style={{ color: "#B91C1C", fontSize: ".8rem", marginTop: 8 }}>{couponErr}</p>}
                <p className="summary-note">Prueba con AAO10 o FLASH20.</p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
