"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { AdminStats, Order } from "@/lib/types";
import { get } from "@/lib/api";
import { fmt, formatDate } from "@/lib/format";
import { Icon, IconName } from "@/components/Icon";
import { statusClass } from "@/components/cuenta/CuentaPage";

function TrendChart({ data }: { data: { label: string; total: number }[] }) {
  const W = 640;
  const H = 220;
  const PAD = 8;
  const max = Math.max(1, ...data.map((d) => d.total));
  const pts = data.map((d, i) => {
    const x = PAD + (i / Math.max(1, data.length - 1)) * (W - PAD * 2);
    const y = H - PAD - (d.total / max) * (H - PAD * 2);
    return { x, y, ...d };
  });
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = `${line} L${pts[pts.length - 1]?.x ?? PAD},${H - PAD} L${PAD},${H - PAD} Z`;

  return (
    <div className="trend">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Ventas de los últimos 14 días">
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF4D24" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#FF4D24" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={PAD} x2={W - PAD} y1={H * f} y2={H * f} stroke="#ECE3D8" strokeWidth="1" strokeDasharray="4 4" />
        ))}
        <path d={area} fill="url(#trendFill)" />
        <path d={line} fill="none" stroke="#FF4D24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) =>
          i % 2 === 0 ? (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="3.2" fill="#fff" stroke="#FF4D24" strokeWidth="2" />
              <text x={p.x} y={H - PAD + 14} textAnchor="middle" fontSize="9" fill="#5B6472">
                {p.label}
              </text>
            </g>
          ) : null
        )}
      </svg>
      <div className="trend__labels">
        <span>Hace 14 días</span>
        <span>Máx: {fmt.format(max)}</span>
        <span>Hoy</span>
      </div>
    </div>
  );
}

function Kpi({ icon, value, label, tone = "" }: { icon: IconName; value: string; label: string; tone?: string }) {
  return (
    <div className="kpi">
      <span className={`kpi__icon ${tone}`}>
        <Icon name={icon} size={22} />
      </span>
      <div>
        <b>{value}</b>
        <span>{label}</span>
      </div>
    </div>
  );
}

export default function DashboardSection({ isSuper }: { isSuper: boolean }) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    get<AdminStats>("/admin/stats", { auth: true })
      .then(setStats)
      .catch((e) => {
        if (e?.status === 403) setForbidden(true);
        else setError(e instanceof Error ? e.message : "Error");
      });
    get<Order[]>("/admin/orders", { auth: true })
      .then((list) => setOrders(list.slice(0, 6)))
      .catch(() => setOrders([]));
  }, []);

  if (forbidden) {
    return (
      <div className="acard" style={{ textAlign: "center", padding: 48 }}>
        <Icon name="shield" size={40} className="pd__fallback" />
        <h2 style={{ fontFamily: "var(--font-display)", marginTop: 10 }}>Sin permiso</h2>
        <p style={{ color: "var(--adm-muted)", marginTop: 6 }}>
          Tu rol no puede ver las estadísticas de la tienda.
        </p>
      </div>
    );
  }

  if (error) return <p className="grid__empty">No se pudo cargar el dashboard: {error}</p>;
  if (!stats) return <p className="grid__empty">Cargando estadísticas…</p>;

  const pendingOrders = orders.filter((o) => o.estado === "Pendiente de pago" || o.estado === "Pagado").slice(0, 5);

  return (
    <>
      <div className="kpis">
        <Kpi icon="chart" value={fmt.format(stats.ventasHoy)} label="Ventas de hoy" />
        <Kpi icon="package" value={fmt.format(stats.ventasSemana)} label="Ventas de la semana" tone="kpi__icon--blue" />
        <Kpi icon="card" value={fmt.format(stats.ventasMes)} label="Ventas del mes" tone="kpi__icon--gold" />
        <Kpi icon="tag" value={fmt.format(stats.ticket)} label="Ticket medio" tone="kpi__icon--green" />
      </div>

      <div className="admgrid">
        <div className="acard">
          <h2>
            Tendencia de ventas <small>últimos 14 días</small>
          </h2>
          <TrendChart data={stats.last14} />
        </div>
        <div className="acard">
          <h2>
            Ventas por categoría <small>total histórico</small>
          </h2>
          {Object.entries(stats.byCat).map(([cat, total]) => {
            const max = Math.max(1, ...Object.values(stats.byCat));
            return (
              <div className="hbar" key={cat}>
                <span className="hbar__label">{cat}</span>
                <div className="hbar__track">
                  <div className="hbar__fill" style={{ width: `${(total / max) * 100}%` }} />
                </div>
                <b>{fmt.format(total)}</b>
              </div>
            );
          })}
          {Object.keys(stats.byCat).length === 0 && (
            <p style={{ color: "var(--adm-muted)", fontSize: ".85rem" }}>Sin ventas registradas todavía.</p>
          )}
        </div>
      </div>

      <div className="admgrid-3">
        <div className="acard">
          <h2>
            Pedidos por procesar <small>{stats.pending}</small>
          </h2>
          {pendingOrders.length === 0 ? (
            <p style={{ color: "var(--adm-muted)", fontSize: ".85rem" }}>
              No hay pedidos esperando. ¡Todo al día!
            </p>
          ) : (
            pendingOrders.map((o) => (
              <div className="hbar" key={o.id}>
                <span className="hbar__label">{o.id}</span>
                <span className={`status ${statusClass(o.estado)}`}>{o.estado}</span>
                <b>{fmt.format(o.total)}</b>
              </div>
            ))
          )}
          <Link href="/admin?sec=pedidos" className="link-btn" style={{ display: "inline-block", marginTop: 10 }}>
            Ir a pedidos →
          </Link>
        </div>

        <div className="acard">
          <h2>
            Clientes nuevos <small>{stats.newClients}</small>
          </h2>
          <p style={{ fontFamily: "var(--font-display)", fontSize: "2.2rem", margin: "6px 0 2px" }}>
            {stats.newClients}
          </p>
          <p style={{ color: "var(--adm-muted)", fontSize: ".82rem" }}>
            registros en los últimos 30 días
          </p>
          <h2 style={{ marginTop: 18 }}>
            Top productos
          </h2>
          {stats.top.length === 0 && (
            <p style={{ color: "var(--adm-muted)", fontSize: ".85rem" }}>Aún no hay ventas.</p>
          )}
          {stats.top.slice(0, 4).map((t) => (
            <div className="hbar" key={t.product}>
              <span className="hbar__label" title={t.product}>
                {t.product}
              </span>
              <div className="hbar__track">
                <div
                  className="hbar__fill"
                  style={{ width: `${(t.qty / Math.max(1, stats.top[0]?.qty ?? 1)) * 100}%` }}
                />
              </div>
              <b>{t.qty} uds.</b>
            </div>
          ))}
        </div>

        <div className="acard">
          <h2>
            Stock bajo <small>{stats.lowStock.length}</small>
          </h2>
          {stats.lowStock.length === 0 ? (
            <p style={{ color: "var(--adm-muted)", fontSize: ".85rem" }}>Inventario en niveles saludables.</p>
          ) : (
            stats.lowStock.slice(0, 6).map((p) => (
              <div className="hbar" key={p.id}>
                <span className="hbar__label" title={p.name}>
                  {p.name}
                </span>
                <div className="hbar__track">
                  <div
                    className="hbar__fill"
                    style={{ width: `${Math.min(100, p.stock * 5)}%`, background: "#DC2626" }}
                  />
                </div>
                <b>{p.stock} uds.</b>
              </div>
            ))
          )}
          <Link href="/admin?sec=inventario" className="link-btn" style={{ display: "inline-block", marginTop: 10 }}>
            Ir a inventario →
          </Link>
        </div>
      </div>

      {isSuper && (
        <div className="acard" style={{ marginTop: 16 }}>
          <h2>Últimos pedidos</h2>
          <div className="admin-table-wrap">
            <table className="ptable">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Estado</th>
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
                      {fmt.format(o.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
