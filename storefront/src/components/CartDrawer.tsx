"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { fmt } from "@/lib/format";
import { Icon } from "@/components/Icon";
import { FREE_SHIP_FALLBACK } from "@/lib/constants";

export function CartDrawer() {
  const { drawerOpen, setDrawerOpen, lines, count, subtotal, setQty, remove } = useCart();
  const router = useRouter();

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [drawerOpen, setDrawerOpen]);

  const missing = FREE_SHIP_FALLBACK - subtotal;

  return (
    <>
      <div className={`overlay ${drawerOpen ? "is-open" : ""}`} onClick={() => setDrawerOpen(false)} />
      <aside className={`cart ${drawerOpen ? "is-open" : ""}`} aria-label="Carrito" aria-hidden={!drawerOpen}>
        <div className="cart__head">
          <h3>
            Tu cesta <span>{count ? `· ${count} artículo${count > 1 ? "s" : ""}` : ""}</span>
          </h3>
          <button className="cart__close" onClick={() => setDrawerOpen(false)} aria-label="Cerrar carrito">
            <Icon name="close" />
          </button>
        </div>

        <div className="cart__ship">
          <p>
            {subtotal >= FREE_SHIP_FALLBACK ? (
              <>
                <strong>Envío gratis desbloqueado</strong> — lo recibirás en 24/48h
              </>
            ) : (
              <>
                Te faltan <strong>{fmt.format(missing)}</strong> para el envío gratis
              </>
            )}
          </p>
          <div className="cart__ship-track">
            <div
              className="cart__ship-fill"
              style={{ width: `${Math.min(100, (subtotal / FREE_SHIP_FALLBACK) * 100)}%` }}
            />
          </div>
        </div>

        <div className="cart__items">
          {lines.length === 0 ? (
            <div className="cart__empty">
              <Icon name="cart" size={56} />
              <p>
                Tu carrito está vacío.
                <br />
                Descubre ofertas que no puedes perderte.
              </p>
              <Link className="btn btn--primary" href="/categoria/ofertas" onClick={() => setDrawerOpen(false)}>
                Explorar ofertas
              </Link>
            </div>
          ) : (
            lines.map((l) => (
              <div className="citem" key={l.id}>
                <Link
                  className="citem__media"
                  href={`/producto/${l.id}`}
                  onClick={() => setDrawerOpen(false)}
                  style={{ background: "linear-gradient(140deg,#FF6A00,#FF3D1F)" }}
                >
                  {l.product?.img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="citem__img" src={l.product.img} alt={l.product.name} />
                  ) : (
                    <Icon name="box" className="citem__fallback" />
                  )}
                </Link>
                <div>
                  <p className="citem__name">{l.product?.name || `Producto #${l.id}`}</p>
                  <p className="citem__price">{l.product ? `${fmt.format(l.product.price)} / ud.` : ""}</p>
                  <div className="citem__qty">
                    <button onClick={() => setQty(l.id, l.qty - 1)} aria-label="Quitar uno">
                      −
                    </button>
                    <span>{l.qty}</span>
                    <button onClick={() => setQty(l.id, l.qty + 1)} aria-label="Añadir uno">
                      +
                    </button>
                  </div>
                </div>
                <div className="citem__right">
                  <button className="citem__remove" onClick={() => remove(l.id)} aria-label="Eliminar">
                    <Icon name="trash" />
                  </button>
                  <span className="citem__total">
                    {l.product ? fmt.format(l.product.price * l.qty) : ""}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="cart__foot">
          <div className="cart__row cart__row--muted">
            <span>Subtotal</span>
            <span>{fmt.format(subtotal)}</span>
          </div>
          <div className="cart__row cart__row--total">
            <span>Total estimado</span>
            <strong>{fmt.format(subtotal)}</strong>
          </div>
          <button
            className="btn btn--primary btn--block"
            disabled={lines.length === 0}
            onClick={() => {
              setDrawerOpen(false);
              router.push("/checkout");
            }}
          >
            Tramitar pedido
          </button>
          <button className="btn btn--outline btn--block" style={{ marginTop: 8 }} onClick={() => setDrawerOpen(false)}>
            Seguir comprando
          </button>
          <p className="cart__secure">
            <Icon name="shield" size={14} /> Compra segura cifrada SSL
          </p>
        </div>
      </aside>
    </>
  );
}
