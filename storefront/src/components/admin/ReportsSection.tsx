"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminStats, Order } from "@/lib/types";
import { get } from "@/lib/api";
import { fmt, formatDate } from "@/lib/format";
import { Icon } from "@/components/Icon";
import { statusClass } from "@/components/cuenta/CuentaPage";

function toCsv(rows: (string | number)[][]): string {
  return rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsSection() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [forbidden, setForbidden] = useState(false);

  const load = useCallback(() => {
    get<AdminStats>("/admin/stats", { auth: true })
      .then(setStats)
      .catch((e) => {
        if (e?.status === 403) setForbidden(true);
      });
    get<Order[]>("/admin/orders", { auth: true })
      .then(setOrders)
      .catch(() => setOrders([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (forbidden) {
    return (
      <div className="acard" style={{ textAlign: "center", padding: 48 }}>
        <Icon name="shield" size={40} className="pd__fallback" />
        <h2 style={{ fontFamily: "var(--font-display)", marginTop: 10 }}>Sin permiso</h2>
        <p style={{ color: "var(--adm-muted)" }}>Los reportes requieren rol de superadministrador.</p>
      </div>
    );
  }

  if (!stats) return <p className="grid__empty">Generando reportes…</p>;

  const exportOrders = () => {
    const rows: (string | number)[][] = [
      ["Pedido", "Fecha", "Cliente", "Email", "Estado", "Subtotal", "Descuento", "Envío", "Total"],
      ...orders.map((o) => [
        o.id,
        o.fecha,
        o.nombreCliente,
        o.cliente ?? "",
        o.estado,
        o.subtotal.toFixed(2),
        o.descuento.toFixed(2),
        o.envio.toFixed(2),
        o.total.toFixed(2),
      ]),
    ];
    downloadCsv(`pedidos_${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows));
  };

  const exportCategories = () => {
    const rows: (string | number)[][] = [
      ["Categoría", "Ventas (€)"],
      ...Object.entries(stats.byCat).map(([cat, total]) => [cat, total.toFixed(2)]),
    ];
    downloadCsv(`ventas_categorias.csv`, toCsv(rows));
  };

  const totalPeriod = stats.last14.reduce((s, d) => s + d.total, 0);

  return (
    <>
      <div className="kpis">
        <div className="kpi">
          <span className="kpi__icon">
            <Icon name="chart" size={22} />
          </span>
          <div>
            <b>{fmt.format(stats.ventasMes)}</b>
            <span>Ventas del mes</span>
          </div>
        </div>
        <div className="kpi">
          <span className="kpi__icon kpi__icon--green">
            <Icon name="package" size={22} />
          </span>
          <div>
            <b>{fmt.format(totalPeriod)}</b>
            <span>Últimos 14 días</span>
          </div>
        </div>
        <div className="kpi">
          <span className="kpi__icon kpi__icon--blue">
            <Icon name="tag" size={22} />
          </span>
          <div>
            <b>{fmt.format(stats.ticket)}</b>
            <span>Ticket medio</span>
          </div>
        </div>
        <div className="kpi">
          <span className="kpi__icon kpi__icon--gold">
            <Icon name="users" size={22} />
          </span>
          <div>
            <b>{stats.newClients}</b>
            <span>Clientes nuevos</span>
          </div>
        </div>
      </div>

      <div className="acard" style={{ marginBottom: 16 }}>
        <h2>
          Exportar datos <small>CSV generado en el navegador</small>
        </h2>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn btn--outline btn--sm" onClick={exportOrders}>
            <Icon name="arrow" size={16} /> Pedidos ({orders.length})
          </button>
          <button className="btn btn--outline btn--sm" onClick={exportCategories}>
            <Icon name="arrow" size={16} /> Ventas por categoría
          </button>
        </div>
      </div>

      <div className="acard admin-table-wrap">
        <h2>
          Todos los pedidos <small>{orders.length} registros</small>
        </h2>
        <table className="ptable admin-table">
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Estado</th>
              <th style={{ textAlign: "right" }}>Subtotal</th>
              <th style={{ textAlign: "right" }}>Descuento</th>
              <th style={{ textAlign: "right" }}>Envío</th>
              <th style={{ textAlign: "right" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td className="num">{o.id}</td>
                <td className="num">{formatDate(o.fecha)}</td>
                <td>{o.nombreCliente}</td>
                <td>
                  <span className={`status ${statusClass(o.estado)}`}>{o.estado}</span>
                </td>
                <td className="num" style={{ textAlign: "right" }}>
                  {fmt.format(o.subtotal)}
                </td>
                <td className="num" style={{ textAlign: "right" }}>
                  {o.descuento ? `-${fmt.format(o.descuento)}` : "—"}
                </td>
                <td className="num" style={{ textAlign: "right" }}>
                  {o.envio === 0 ? "Gratis" : fmt.format(o.envio)}
                </td>
                <td className="num" style={{ textAlign: "right" }}>
                  <strong>{fmt.format(o.total)}</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
