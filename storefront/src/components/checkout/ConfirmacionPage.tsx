"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Order } from "@/lib/types";
import { get } from "@/lib/api";
import { deliveryDate, fmt, formatDate } from "@/lib/format";
import { Icon } from "@/components/Icon";

export default function ConfirmacionPage() {
  const params = useSearchParams();
  const id = params.get("id") ?? "";
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    // Fallback para pedidos de invitado (la API solo expone /orders/:id al propietario o admin)
    try {
      const raw = sessionStorage.getItem("aao_last_order");
      if (raw) {
        const last = JSON.parse(raw) as Order;
        if (last.id === id) {
          setOrder(last);
          return;
        }
      }
    } catch {
      /* ignore */
    }
    get<Order>(`/orders/${encodeURIComponent(id)}`, { auth: true })
      .then(setOrder)
      .catch((e) => setError(e instanceof Error ? e.message : "No se pudo cargar el pedido"));
  }, [id]);

  if (!id) {
    return (
      <div className="page container">
        <div className="box confirm">
          <h1>Falta el identificador del pedido</h1>
          <p>La URL no incluye el número de pedido.</p>
          <div className="confirm__cta">
            <Link className="btn btn--primary" href="/">
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page container">
        <div className="box confirm">
          <h1>No pudimos cargar tu pedido</h1>
          <p>{error}</p>
          <div className="confirm__cta">
            <Link className="btn btn--primary" href="/cuenta">
              Ver mis pedidos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="page container">
        <p className="grid__empty">Cargando confirmación…</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container page--narrow">
        <div className="box confirm">
          <div className="confirm__icon">
            <Icon name="check" size={42} />
          </div>
          <h1>¡Gracias por tu pedido!</h1>
          <span className="confirm__order">{order.id}</span>
          <p>
            Recibirás un correo de confirmación en <strong>{order.direccion.email}</strong> con los
            detalles del pedido.
          </p>
          <p style={{ marginTop: 10 }}>
            <span style={{ color: "var(--green)", display: "inline-flex", verticalAlign: "-3px" }}>
              <Icon name="truck" size={18} />
            </span>{" "}
            Entrega estimada: <strong>{deliveryDate(order.pago === "Contra reembolso" ? 4 : 3)}</strong>
          </p>
          {order.tracking && (
            <p>
              Nº de seguimiento: <strong>{order.tracking}</strong>
            </p>
          )}
          <div className="confirm__cta">
            <Link className="btn btn--primary" href="/cuenta">
              Seguir mi pedido
            </Link>
            <Link className="btn btn--outline" href="/categoria/all">
              Seguir comprando
            </Link>
          </div>
        </div>

        <div className="box" style={{ marginTop: 18 }}>
          <h2 style={{ fontFamily: "var(--font-display)", marginBottom: 14 }}>Resumen del pedido</h2>
          <div className="review-line">
            <span>Fecha</span>
            <span>{formatDate(order.fecha)}</span>
          </div>
          {order.items.map((it) => (
            <div className="review-line" key={it.id}>
              <span>
                {it.qty} × {it.nombre}
              </span>
              <span>{fmt.format(it.precio * it.qty)}</span>
            </div>
          ))}
          {order.descuento > 0 && (
            <div className="review-line" style={{ color: "var(--green)" }}>
              <span>Descuento {order.cupon && `(${order.cupon})`}</span>
              <span>-{fmt.format(order.descuento)}</span>
            </div>
          )}
          <div className="review-line">
            <span>Envío</span>
            <span>{order.envio === 0 ? "Gratis" : fmt.format(order.envio)}</span>
          </div>
          <div className="review-line" style={{ fontWeight: 700 }}>
            <span>Total pagado</span>
            <span>{fmt.format(order.total)}</span>
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", margin: "18px 0 8px" }}>Dirección de entrega</h2>
          <p style={{ fontSize: ".88rem", color: "var(--ink-soft)", lineHeight: 1.6 }}>
            <strong style={{ color: "var(--ink)" }}>{order.direccion.nombre}</strong>
            <br />
            {order.direccion.direccion}
            <br />
            {order.direccion.cp} {order.direccion.ciudad}, {order.direccion.provincia} ({order.direccion.pais})
          </p>
          <p style={{ fontSize: ".88rem", color: "var(--ink-soft)", marginTop: 8 }}>
            Método de pago: <strong style={{ color: "var(--ink)" }}>{order.pago}</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
