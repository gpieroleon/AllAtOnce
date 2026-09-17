"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Order } from "@/lib/types";
import { get } from "@/lib/api";
import { fmt, formatDate } from "@/lib/format";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import {
  loadAddresses,
  saveAddresses,
  StoredAddress,
} from "@/lib/storage";
import { CoverImg } from "@/components/CoverImg";
import { Icon } from "@/components/Icon";

export const ESTADOS = ["Pendiente de pago", "Pagado", "En preparación", "Enviado", "Entregado"];

export function statusClass(estado: string): string {
  const map: Record<string, string> = {
    "Pendiente de pago": "status--warn",
    Pagado: "status--info",
    "En preparación": "status--info",
    Enviado: "status--ok",
    Entregado: "status--ok",
    Cancelado: "status--bad",
    Reembolsado: "status--bad",
  };
  return map[estado] ?? "";
}

const EMPTY_ADDR: Omit<StoredAddress, "id"> = {
  nombre: "",
  direccion: "",
  ciudad: "",
  provincia: "",
  cp: "",
  pais: "España",
  telefono: "",
};

function Timeline({ estado }: { estado: string }) {
  const idx = ESTADOS.indexOf(estado);
  return (
    <div className="track" aria-label={`Estado: ${estado}`}>
      {ESTADOS.map((e, i) => (
        <div key={e} className={`track__step ${idx >= i ? "is-done" : ""}`}>
          <span className="track__dot">
            <Icon name="check" size={14} />
          </span>
          <span>{e}</span>
        </div>
      ))}
    </div>
  );
}

function OrderCard({ order, open, onToggle }: { order: Order; open: boolean; onToggle: () => void }) {
  return (
    <article className="order-card">
      <div className="order-card__head">
        <div>
          <p className="order-card__id">{order.id}</p>
          <p className="order-card__meta">
            {formatDate(order.fecha)} · {order.items.length} artículo{order.items.length > 1 ? "s" : ""}
          </p>
        </div>
        <span className={`status ${statusClass(order.estado)}`}>{order.estado}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div className="order-card__items">
            {order.items.slice(0, 4).map((it) => (
              <span className="order-card__thumb" key={it.id} style={{ background: "linear-gradient(140deg,#FF6A00,#FF3D1F)" }}>
                {it.img ? (                  <CoverImg src={it.img} alt={it.nombre} />
                ) : (
                  <Icon name="box" />
                )}
              </span>
            ))}
          </div>
          <span className="order-card__total">{fmt.format(order.total)}</span>
          <button className="btn btn--outline btn--sm" onClick={onToggle}>
            {open ? "Cerrar" : "Detalle"}
          </button>
        </div>
      </div>
      {open && (
        <div style={{ marginTop: 16 }} className="adm-fade">
          <Timeline estado={order.estado} />
          {order.tracking && (
            <p className="order-card__meta" style={{ marginTop: 8 }}>
              Seguimiento: <strong>{order.tracking}</strong>
            </p>
          )}
          <div style={{ marginTop: 10 }}>
            {order.items.map((it) => (
              <div className="review-line" key={it.id}>
                <span>
                  {it.qty} × <Link href={`/producto/${it.id}`} style={{ color: "var(--accent)" }}>{it.nombre}</Link>
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
              <span>Total</span>
              <span>{fmt.format(order.total)}</span>
            </div>
          </div>
          <p className="order-card__meta" style={{ marginTop: 10 }}>
            <strong>{order.direccion.nombre}</strong> · {order.direccion.direccion},{" "}
            {order.direccion.cp} {order.direccion.ciudad} · Pago: {order.pago}
          </p>
        </div>
      )}
    </article>
  );
}

export default function CuentaPage() {
  const router = useRouter();
  const { user, ready, logout, setUserLocal } = useAuth();
  const { wishlist } = useCart();
  const { toast } = useToast();

  const [tab, setTab] = useState<"resumen" | "pedidos" | "direcciones" | "datos">("resumen");
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [openOrder, setOpenOrder] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<StoredAddress[]>([]);
  const [editingAddr, setEditingAddr] = useState<(Omit<StoredAddress, "id"> & { id?: string }) | null>(null);
  const [profile, setProfile] = useState({ name: "", phone: "" });

  // Guard: sin token → /login?from=/cuenta
  useEffect(() => {
    if (ready && !user) router.replace(`/login?from=${encodeURIComponent("/cuenta")}`);
  }, [ready, user, router]);

  useEffect(() => {
    if (!user) return;
    setProfile({ name: user.name || "", phone: user.phone || "" });
    setAddresses(loadAddresses());
    get<Order[]>("/orders/mine", { auth: true })
      .then(setOrders)
      .catch(() => setOrders([]));
  }, [user]);

  const spent = useMemo(
    () => (orders ?? []).filter((o) => o.estado !== "Cancelado").reduce((s, o) => s + o.total, 0),
    [orders]
  );

  if (!ready || !user) {
    return (
      <div className="page container">
        <p className="grid__empty">Comprobando tu sesión…</p>
      </div>
    );
  }

  const saveAddr = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAddr) return;
    const list = [...addresses];
    if (editingAddr.id) {
      const i = list.findIndex((a) => a.id === editingAddr.id);
      if (i >= 0) list[i] = { ...(editingAddr as StoredAddress) };
    } else {
      list.push({ ...(editingAddr as Omit<StoredAddress, "id">), id: `addr_${Date.now()}` });
    }
    setAddresses(list);
    saveAddresses(list);
    setEditingAddr(null);
    toast("Dirección guardada");
  };

  const removeAddr = (id: string) => {
    const list = addresses.filter((a) => a.id !== id);
    setAddresses(list);
    saveAddresses(list);
    toast("Dirección eliminada");
  };

  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    // La API no expone edición de perfil: se guarda en local
    setUserLocal({ ...user, name: profile.name, phone: profile.phone });
    toast("Datos guardados en este navegador");
  };

  const tabs = [
    { id: "resumen", label: "Resumen", icon: "home" as const },
    { id: "pedidos", label: "Pedidos", icon: "package" as const },
    { id: "direcciones", label: "Direcciones", icon: "pin" as const },
    { id: "datos", label: "Mis datos", icon: "user" as const },
  ];

  return (
    <div className="page">
      <div className="container">
        <nav className="crumbs" aria-label="Migas de pan">
          <Link href="/">Inicio</Link>
          <span aria-hidden="true">›</span>
          <span>Mi cuenta</span>
        </nav>

        <div className="page-head">
          <h1>Hola, {user.name.split(" ")[0]}</h1>
          <p>{user.email}</p>
        </div>

        <div className="account-layout">
          <nav className="account-nav" aria-label="Secciones de la cuenta">
            {tabs.map((t) => (
              <button
                key={t.id}
                className={tab === t.id ? "is-active" : ""}
                onClick={() => setTab(t.id as typeof tab)}
              >
                <Icon name={t.icon} /> {t.label}
              </button>
            ))}
            <button
              onClick={() => {
                logout();
                router.push("/");
              }}
              style={{ color: "var(--accent-dark)" }}
            >
              <Icon name="logout" /> Cerrar sesión
            </button>
          </nav>

          <div>
            {tab === "resumen" && (
              <div className="account-tab is-active">
                <div className="stat-cards">
                  <div className="stat-card">
                    <b>{orders?.length ?? "—"}</b>
                    <span>Pedidos realizados</span>
                  </div>
                  <div className="stat-card">
                    <b>{fmt.format(spent)}</b>
                    <span>Total comprado</span>
                  </div>
                  <div className="stat-card">
                    <b>{wishlist.length}</b>
                    <span>Productos favoritos</span>
                  </div>
                </div>
                <div className="box">
                  <h2>Último pedido</h2>
                  {orders && orders.length > 0 ? (
                    <OrderCard
                      order={orders[0]}
                      open={openOrder === orders[0].id}
                      onToggle={() => setOpenOrder(openOrder === orders[0].id ? null : orders[0].id)}
                    />
                  ) : (
                    <p style={{ color: "var(--ink-soft)", fontSize: ".9rem" }}>
                      Todavía no has hecho ningún pedido.{" "}
                      <Link href="/categoria/ofertas" style={{ color: "var(--accent)", fontWeight: 600 }}>
                        Ver ofertas
                      </Link>
                    </p>
                  )}
                </div>
              </div>
            )}

            {tab === "pedidos" && (
              <div className="account-tab is-active">
                {orders === null ? (
                  <p className="grid__empty">Cargando pedidos…</p>
                ) : orders.length === 0 ? (
                  <div className="box">
                    <h2>Mis pedidos</h2>
                    <p style={{ color: "var(--ink-soft)" }}>No tienes pedidos todavía.</p>
                  </div>
                ) : (
                  orders.map((o) => (
                    <OrderCard
                      key={o.id}
                      order={o}
                      open={openOrder === o.id}
                      onToggle={() => setOpenOrder(openOrder === o.id ? null : o.id)}
                    />
                  ))
                )}
              </div>
            )}

            {tab === "direcciones" && (
              <div className="account-tab is-active">
                <div className="box">
                  <h2>Direcciones guardadas</h2>
                  <p className="summary-note" style={{ marginBottom: 14 }}>
                    Se guardan en este navegador (la API no incluye endpoint de direcciones).
                  </p>
                  {editingAddr ? (
                    <form className="form-grid" onSubmit={saveAddr}>
                      {(
                        [
                          ["nombre", "Nombre completo"],
                          ["telefono", "Teléfono"],
                          ["direccion", "Dirección"],
                          ["ciudad", "Ciudad"],
                          ["provincia", "Provincia"],
                          ["cp", "Código postal"],
                          ["pais", "País"],
                        ] as [keyof typeof EMPTY_ADDR, string][]
                      ).map(([k, label]) => (
                        <div className={`field ${k === "direccion" ? "field--full" : ""}`} key={k}>
                          <label htmlFor={`addr_${k}`}>{label}</label>
                          <input
                            id={`addr_${k}`}
                            value={String(editingAddr[k] ?? "")}
                            onChange={(e) => setEditingAddr({ ...editingAddr, [k]: e.target.value })}
                            required
                          />
                        </div>
                      ))}
                      <div className="field field--full" style={{ flexDirection: "row", gap: 10 }}>
                        <button className="btn btn--primary btn--sm" type="submit">
                          Guardar dirección
                        </button>
                        <button className="btn btn--outline btn--sm" type="button" onClick={() => setEditingAddr(null)}>
                          Cancelar
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="addr-grid">
                        {addresses.map((a) => (
                          <div className={`addr-card ${a.predeterminada ? "is-default" : ""}`} key={a.id}>
                            {a.predeterminada && <span className="addr-card__badge">Predeterminada</span>}
                            <strong>{a.nombre}</strong>
                            <p>
                              {a.direccion}
                              <br />
                              {a.cp} {a.ciudad}, {a.provincia}
                              <br />
                              {a.pais} · {a.telefono}
                            </p>
                            <div className="addr-card__actions">
                              <button
                                className="link-btn"
                                onClick={() =>
                                  setEditingAddr({ ...a })
                                }
                              >
                                Editar
                              </button>
                              <button className="link-btn" style={{ color: "#B91C1C" }} onClick={() => removeAddr(a.id)}>
                                Eliminar
                              </button>
                            </div>
                          </div>
                        ))}
                        <button
                          className="addr-card addr-card--new"
                          onClick={() => setEditingAddr({ ...EMPTY_ADDR })}
                        >
                          + Añadir nueva dirección
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {tab === "datos" && (
              <div className="account-tab is-active">
                <div className="box">
                  <h2>Mis datos</h2>
                  <p className="summary-note" style={{ marginBottom: 14 }}>
                    La API no permite editar el perfil: los cambios se guardan localmente.
                  </p>
                  <form className="form-grid" onSubmit={saveProfile}>
                    <div className="field">
                      <label htmlFor="pname">Nombre completo</label>
                      <input
                        id="pname"
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="pphone">Teléfono</label>
                      <input
                        id="pphone"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="pemail">Correo (no editable)</label>
                      <input id="pemail" value={user.email} disabled />
                    </div>
                    <div className="field">
                      <label>Rol</label>
                      <input value={user.role} disabled />
                    </div>
                    <div className="field field--full">
                      <button className="btn btn--primary btn--sm" type="submit">
                        Guardar cambios
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
