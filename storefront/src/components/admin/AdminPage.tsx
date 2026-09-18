"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Icon, IconName } from "@/components/Icon";
import DashboardSection from "./DashboardSection";
import OrdersSection from "./OrdersSection";
import ProductsSection from "./ProductsSection";
import CategoriesSection from "./CategoriesSection";
import InventorySection from "./InventorySection";
import ClientsSection from "./ClientsSection";
import CouponsSection from "./CouponsSection";
import ReviewsSection from "./ReviewsSection";
import ReportsSection from "./ReportsSection";
import ShippingSection from "./ShippingSection";
import PaymentsSection from "./PaymentsSection";
import SettingsSection from "./SettingsSection";
import UsersSection from "./UsersSection";

interface Item {
  id: string;
  label: string;
  icon: IconName;
  super?: boolean; // solo visible para superadmin
}

interface Group {
  title: string;
  items: Item[];
}

const GROUPS: Group[] = [
  {
    title: "Principal",
    items: [
      { id: "dashboard", label: "Dashboard", icon: "home" },
      { id: "reportes", label: "Reportes", icon: "chart", super: true },
    ],
  },
  {
    title: "Ventas",
    items: [
      { id: "pedidos", label: "Pedidos", icon: "package" },
      { id: "clientes", label: "Clientes", icon: "users" },
      { id: "cupones", label: "Cupones", icon: "percent" },
    ],
  },
  {
    title: "Catálogo",
    items: [
      { id: "productos", label: "Productos", icon: "box" },
      { id: "categorias", label: "Categorías", icon: "tag" },
      { id: "inventario", label: "Inventario", icon: "chart" },
      { id: "resenas", label: "Reseñas", icon: "starO" },
    ],
  },
  {
    title: "Configuración",
    items: [
      { id: "envios", label: "Envíos", icon: "truck", super: true },
      { id: "pagos", label: "Pagos", icon: "card", super: true },
      { id: "configuracion", label: "Configuración", icon: "gear", super: true },
      { id: "usuarios", label: "Usuarios", icon: "users", super: true },
    ],
  },
];

const TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  reportes: "Reportes",
  pedidos: "Pedidos",
  clientes: "Clientes",
  cupones: "Cupones",
  productos: "Productos",
  categorias: "Categorías",
  inventario: "Inventario",
  resenas: "Reseñas",
  envios: "Métodos de envío",
  pagos: "Métodos de pago",
  configuracion: "Configuración",
  usuarios: "Usuarios",
};

const NOTIFS = [
  { text: "3 pedidos pendientes de procesar", time: "hace 5 min" },
  { text: "Stock bajo: Auriculares Nova X", time: "hace 1 h" },
  { text: "Nuevo cliente registrado", time: "hace 2 h" },
];

export default function AdminPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, ready, isAdmin, logout } = useAuth();
  const [sideOpen, setSideOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  const sec = params.get("sec") || "dashboard";

  // Cerrar las notificaciones al hacer clic fuera de ellas
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // Guard: /admin exige sesión de staff (admin/superadmin).
  // Sin token o con sesión de cliente → /admin/login.
  useEffect(() => {
    if (!ready) return;
    if (!localStorage.getItem("aao_token") || (user && !isAdmin)) {
      router.replace("/admin/login");
    }
  }, [ready, user, isAdmin, router]);

  const isSuper = user?.role === "superadmin";

  const visibleGroups = useMemo(
    () =>
      GROUPS.map((g) => ({
        ...g,
        items: g.items.filter((i) => !i.super || isSuper),
      })).filter((g) => g.items.length > 0),
    [isSuper]
  );

  if (!ready || !user || !isAdmin) {
    return (
      <div className="adm">
        <div className="adm__main" style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
          <p style={{ color: "var(--adm-muted)" }}>Comprobando acceso…</p>
        </div>
      </div>
    );
  }

  const renderSection = () => {
    switch (sec) {
      case "dashboard":
        return <DashboardSection isSuper={isSuper} />;
      case "pedidos":
        return <OrdersSection />;
      case "productos":
        return <ProductsSection isSuper={isSuper} />;
      case "categorias":
        return <CategoriesSection />;
      case "inventario":
        return <InventorySection />;
      case "clientes":
        return <ClientsSection />;
      case "cupones":
        return <CouponsSection />;
      case "resenas":
        return <ReviewsSection />;
      case "reportes":
        return isSuper ? <ReportsSection /> : <NoPermiso />;
      case "envios":
        return isSuper ? <ShippingSection /> : <NoPermiso />;
      case "pagos":
        return isSuper ? <PaymentsSection /> : <NoPermiso />;
      case "configuracion":
        return isSuper ? <SettingsSection /> : <NoPermiso />;
      case "usuarios":
        return isSuper ? <UsersSection /> : <NoPermiso />;
      default:
        return <DashboardSection isSuper={isSuper} />;
    }
  };

  const go = (id: string) => {
    router.replace(`/admin?sec=${id}`);
    setSideOpen(false);
  };

  return (
    <div className="adm">
      <aside className={`adm__side ${sideOpen ? "is-open" : ""}`}>
        <div className="adm__logo">
          <span className="logo__mark">AAO</span>
          <div className="adm__logo-name">
            All At Once
            <small>Back-office</small>
          </div>
        </div>
        <nav className="adm__nav" aria-label="Navegación del panel">
          {visibleGroups.map((g) => (
            <div className="adm__navgroup" key={g.title}>
              <p className="adm__navtitle">{g.title}</p>
              {g.items.map((item) => (
                <button
                  key={item.id}
                  className={sec === item.id ? "is-active" : ""}
                  onClick={() => go(item.id)}
                >
                  <Icon name={item.icon} size={17} /> {item.label}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="adm__sidefoot">
          <Link href="/">
            <Icon name="home" /> Ver tienda
          </Link>
          <button
            onClick={() => {
              logout();
              router.push("/login");
            }}
          >
            <Icon name="logout" /> Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="adm__main">
        <div className="adm__top">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button className="adm__burger" onClick={() => setSideOpen((v) => !v)} aria-label="Menú">
              <Icon name="filter" />
            </button>
            <div>
              <h1>{TITLES[sec] || "Dashboard"}</h1>
              <p>Resumen y gestión de la tienda</p>
            </div>
          </div>
          <div className="adm__topright">
            <div style={{ position: "relative" }} ref={bellRef}>
              <button className="adm__bell" onClick={() => setBellOpen((v) => !v)} aria-label="Notificaciones">
                <Icon name="bell" />
                <span className="adm__bellcount">3</span>
              </button>
              {bellOpen && (
                <div className="adm__belldrop">
                  <h4>Notificaciones</h4>
                  {NOTIFS.map((n) => (
                    <div className="adm__belldrop-item" key={n.text}>
                      {n.text}
                      <br />
                      <small>{n.time}</small>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="adm__user">
              <span className="adm__avatar">{user.name.charAt(0).toUpperCase()}</span>
              <div className="adm__userinfo">
                <strong>{user.name}</strong>
                <span className="adm__rolebadge">{user.role}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="adm__content adm-fade" key={sec}>
          {renderSection()}
        </div>
      </div>
    </div>
  );
}

export function NoPermiso() {
  return (
    <div className="acard" style={{ textAlign: "center", padding: 48 }}>
      <Icon name="shield" size={40} className="pd__fallback" />
      <h2 style={{ fontFamily: "var(--font-display)", marginTop: 10 }}>Sin permiso</h2>
      <p style={{ color: "var(--adm-muted)", marginTop: 6 }}>
        Tu rol no tiene acceso a esta sección. Contacta con un superadministrador.
      </p>
    </div>
  );
}
