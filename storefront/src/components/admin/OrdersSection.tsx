"use client";

import { useCallback, useEffect, useState } from "react";
import type { Order } from "@/lib/types";
import { get, patch } from "@/lib/api";
import { fmt, formatDate } from "@/lib/format";
import { useToast } from "@/context/ToastContext";
import { Icon } from "@/components/Icon";
import { statusClass } from "@/components/cuenta/CuentaPage";

export const ORDER_STATES = [
  "Pendiente de pago",
  "Pagado",
  "En preparación",
  "Enviado",
  "Entregado",
  "Cancelado",
  "Reembolsado",
];

export function printInvoice(order: Order) {
  const w = window.open("", "_blank", "width=820,height=900");
  if (!w) return;
  const rows = order.items
    .map(
      (it) => `<tr>
        <td>${it.nombre}</td>
        <td style="text-align:center">${it.qty}</td>
        <td style="text-align:right">${fmt.format(it.precio)}</td>
        <td style="text-align:right">${fmt.format(it.precio * it.qty)}</td>
      </tr>`
    )
    .join("");
  w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8">
<title>Factura ${order.id}</title>
<style>
  body{font-family:Inter,Arial,sans-serif;color:#171310;margin:40px}
  h1{font-size:1.4rem;margin:0}
  .brand{color:#FF4D24;font-weight:700}
  table{width:100%;border-collapse:collapse;margin-top:24px;font-size:.9rem}
  th,td{border-bottom:1px solid #ECE3D8;padding:10px 8px;text-align:left}
  th{font-size:.72rem;text-transform:uppercase;letter-spacing:.06em;color:#6E655C}
  .tot{margin-top:16px;margin-left:auto;width:280px;font-size:.95rem}
  .tot div{display:flex;justify-content:space-between;padding:4px 0}
  .tot .grand{border-top:2px solid #171310;font-weight:700;font-size:1.15rem;padding-top:8px}
  .meta{margin-top:20px;font-size:.85rem;color:#6E655C;line-height:1.6}
  header{display:flex;justify-content:space-between;align-items:flex-start}
</style></head><body>
<header>
  <div><h1><span class="brand">All At Once</span> — Factura</h1>
  <p class="meta">Pedido ${order.id} · ${formatDate(order.fecha)}<br>Estado: ${order.estado} · Pago: ${order.pago}${order.tracking ? ` · Seguimiento: ${order.tracking}` : ""}</p></div>
  <button onclick="window.print()" style="padding:10px 18px;border-radius:999px;border:none;background:#FF4D24;color:#fff;font-weight:600;cursor:pointer">Imprimir</button>
</header>
<p class="meta"><strong style="color:#171310">${order.direccion.nombre}</strong><br>${order.direccion.direccion}<br>${order.direccion.cp} ${order.direccion.ciudad}, ${order.direccion.provincia} (${order.direccion.pais})<br>${order.direccion.email} · ${order.direccion.telefono}</p>
<table>
<thead><tr><th>Producto</th><th style="text-align:center">Cant.</th><th style="text-align:right">Precio</th><th style="text-align:right">Importe</th></tr></thead>
<tbody>${rows}</tbody>
</table>
<div class="tot">
  <div><span>Subtotal</span><span>${fmt.format(order.subtotal)}</span></div>
  ${order.descuento > 0 ? `<div><span>Descuento (${order.cupon})</span><span>-${fmt.format(order.descuento)}</span></div>` : ""}
  <div><span>Envío</span><span>${order.envio === 0 ? "Gratis" : fmt.format(order.envio)}</span></div>
  <div class="grand"><span>Total</span><span>${fmt.format(order.total)}</span></div>
</div>
<p class="meta" style="margin-top:30px">IVA incluido según tipo impositivo vigente. Gracias por comprar en All At Once.</p>
</body></html>`);
  w.document.close();
}

export default function OrdersSection() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [estado, setEstado] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [q, setQ] = useState("");
  const [forbidden, setForbidden] = useState(false);
  const [detail, setDetail] = useState<Order | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (estado) params.set("estado", estado);
    if (desde) params.set("desde", desde);
    if (hasta) params.set("hasta", hasta);
    if (q) params.set("q", q);
    get<Order[]>(`/admin/orders?${params.toString()}`, { auth: true })
      .then(setOrders)
      .catch((e) => {
        if (e?.status === 403) setForbidden(true);
        else setOrders([]);
      });
  }, [estado, desde, hasta, q]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  if (forbidden) {
    return (
      <div className="acard" style={{ textAlign: "center", padding: 48 }}>
        <Icon name="shield" size={40} className="pd__fallback" />
        <h2 style={{ fontFamily: "var(--font-display)", marginTop: 10 }}>Sin permiso</h2>
        <p style={{ color: "var(--adm-muted)" }}>Tu rol no puede gestionar pedidos.</p>
      </div>
    );
  }

  const saveDetail = async () => {
    if (!detail) return;
    setSaving(true);
    try {
      const updated = await patch<Order>(`/admin/orders/${encodeURIComponent(detail.id)}`, {
        estado: detail.estado,
        tracking: detail.tracking,
      }, { auth: true });
      setOrders((prev) => prev?.map((o) => (o.id === updated.id ? updated : o)) ?? null);
      setDetail(updated);
      toast("Pedido actualizado");
    } catch (e) {
      toast(e instanceof Error ? `Error: ${e.message}` : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="admin-toolbar">
        <input
          type="search"
          placeholder="Buscar por ID o cliente…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select value={estado} onChange={(e) => setEstado(e.target.value)} aria-label="Filtrar por estado">
          <option value="">Todos los estados</option>
          {ORDER_STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} aria-label="Desde" />
        <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} aria-label="Hasta" />
      </div>

      <div className="acard admin-table-wrap">
        {orders === null ? (
          <p className="grid__empty">Cargando pedidos…</p>
        ) : orders.length === 0 ? (
          <p className="grid__empty">No hay pedidos con esos filtros.</p>
        ) : (
          <table className="ptable admin-table">
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Pago</th>
                <th>Estado</th>
                <th style={{ textAlign: "right" }}>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="num">{o.id}</td>
                  <td className="num">{formatDate(o.fecha)}</td>
                  <td>
                    {o.nombreCliente}
                    <br />
                    <small style={{ color: "var(--adm-muted)" }}>{o.cliente}</small>
                  </td>
                  <td>{o.pago}</td>
                  <td>
                    <span className={`status ${statusClass(o.estado)}`}>{o.estado}</span>
                  </td>
                  <td className="num" style={{ textAlign: "right" }}>
                    {fmt.format(o.total)}
                  </td>
                  <td>
                    <button className="btn btn--outline btn--sm" onClick={() => setDetail(o)}>
                      Gestionar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {detail && (
        <div className="overlay is-open" onClick={() => setDetail(null)} style={{ zIndex: 200 }}>
          <div
            className="acard adm-fade"
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "min(680px, 92vw)",
              maxHeight: "86vh",
              overflowY: "auto",
              zIndex: 210,
            }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`Detalle del pedido ${detail.id}`}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h2 style={{ fontFamily: "var(--font-display)", margin: 0 }}>{detail.id}</h2>
              <button className="cart__close" onClick={() => setDetail(null)} aria-label="Cerrar">
                <Icon name="close" />
              </button>
            </div>

            <p style={{ fontSize: ".84rem", color: "var(--adm-muted)" }}>
              {formatDate(detail.fecha)} · {detail.nombreCliente} · {detail.direccion.direccion},{" "}
              {detail.direccion.cp} {detail.direccion.ciudad}
            </p>

            <div style={{ marginTop: 12 }}>
              {detail.items.map((it) => (
                <div className="review-line" key={it.id}>
                  <span>
                    {it.qty} × {it.nombre}
                  </span>
                  <span>{fmt.format(it.precio * it.qty)}</span>
                </div>
              ))}
              <div className="review-line" style={{ fontWeight: 700 }}>
                <span>Total</span>
                <span>{fmt.format(detail.total)}</span>
              </div>
            </div>

            <div className="form-grid" style={{ marginTop: 16 }}>
              <div className="field">
                <label htmlFor="dEstado">Estado del pedido</label>
                <select
                  id="dEstado"
                  value={detail.estado}
                  onChange={(e) => setDetail({ ...detail, estado: e.target.value })}
                >
                  {ORDER_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="dTracking">Nº de seguimiento</label>
                <input
                  id="dTracking"
                  value={detail.tracking ?? ""}
                  onChange={(e) => setDetail({ ...detail, tracking: e.target.value })}
                  placeholder="AAO-TRACK-0000"
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
              <button className="btn btn--primary btn--sm" onClick={saveDetail} disabled={saving}>
                {saving ? "Guardando…" : "Guardar cambios"}
              </button>
              <button className="btn btn--outline btn--sm" onClick={() => printInvoice(detail)}>
                Imprimir factura
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
