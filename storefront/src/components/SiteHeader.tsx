"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { Icon } from "@/components/Icon";

const NAV = [
  { label: "Ofertas", href: "/categoria/ofertas" },
  { label: "Tecnología", href: "/categoria/Tecnología" },
  { label: "Moda", href: "/categoria/Moda" },
  { label: "Hogar", href: "/categoria/Hogar" },
  { label: "Belleza", href: "/categoria/Belleza" },
  { label: "Accesorios", href: "/categoria/Accesorios" },
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className={`logo ${light ? "logo--light" : ""}`} aria-label="All At Once — inicio">
      <span className="logo__mark">AAO</span>
      <span className="logo__text">
        All At <b>Once</b>
      </span>
    </Link>
  );
}

export function SiteHeader() {
  const { user, isAdmin, logout } = useAuth();
  const { count, wishlist, setDrawerOpen } = useCart();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [cd, setCd] = useState({ h: "00", m: "00", s: "00" });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      const s = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
      setCd({ h: pad(Math.floor(s / 3600)), m: pad(Math.floor((s % 3600) / 60)), s: pad(s % 60) });
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const doSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = query.trim();
    router.push(q ? `/buscar?q=${encodeURIComponent(q)}` : "/buscar");
  };

  const path = typeof window !== "undefined" ? window.location.pathname : "";

  return (
    <>
      <div className="flashbar">
        <div className="container flashbar__inner">
          <p className="flashbar__msg">
            <span className="flashbar__dot" />
            Venta flash: hasta -50% en selección · termina hoy
          </p>
          <p className="flashbar__timer">
            Termina en <span className="countdown">{`${cd.h}:${cd.m}:${cd.s}`}</span>
          </p>
        </div>
      </div>

      <header className="header">
        <div className="container header__inner">
          <button
            className={`burger ${catOpen ? "is-open" : ""}`}
            onClick={() => setCatOpen((v) => !v)}
            aria-label="Menú de secciones"
          >
            <span />
            <span />
            <span />
          </button>

          <Logo />

          <form className="search" onSubmit={doSearch} role="search">
            <Icon name="search" className="search__icon" />
            <input
              className="search__input"
              type="search"
              placeholder="Buscar en All At Once: auriculares, zapatillas, lámparas…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Buscar productos"
            />
            <button className="search__btn" type="submit">
              Buscar
            </button>
          </form>

          <div className="header__actions">
            <div className="auth-wrap" ref={menuRef}>
              <button
                className="action"
                onClick={() => setMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <Icon name="user" />
                <span className="action__label">{user ? user.name.split(" ")[0] : "Cuenta"}</span>
              </button>
              {menuOpen && (
                <div className="auth-menu" role="menu">
                  <p className="auth-menu__hello">
                    {user ? (
                      <>
                        Hola, <strong>{user.name}</strong>
                      </>
                    ) : (
                      <>
                        Hola, <strong>identifícate</strong>
                      </>
                    )}
                  </p>
                  {user ? (
                    <>
                      {isAdmin ? (
                        <Link className="auth-menu__item" href="/admin" onClick={() => setMenuOpen(false)}>
                          Panel de administración
                        </Link>
                      ) : (
                        <Link className="auth-menu__item" href="/cuenta" onClick={() => setMenuOpen(false)}>
                          Mi cuenta
                        </Link>
                      )}
                      <Link className="auth-menu__item" href="/cuenta" onClick={() => setMenuOpen(false)}>
                        Mis pedidos
                      </Link>
                      <Link className="auth-menu__item" href="/favoritos" onClick={() => setMenuOpen(false)}>
                        Favoritos
                      </Link>
                      <button
                        className="auth-menu__item auth-menu__item--logout"
                        onClick={() => {
                          logout();
                          setMenuOpen(false);
                          router.push("/");
                        }}
                      >
                        Cerrar sesión
                      </button>
                    </>
                  ) : (
                    <>
                      <Link className="auth-menu__item" href="/login" onClick={() => setMenuOpen(false)}>
                        Iniciar sesión
                      </Link>
                      <Link className="auth-menu__item" href="/login?nuevo=1" onClick={() => setMenuOpen(false)}>
                        Crear cuenta
                      </Link>
                      <Link className="auth-menu__item" href="/cuenta" onClick={() => setMenuOpen(false)}>
                        Mi cuenta
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            <Link href="/favoritos" className="action" aria-label="Favoritos">
              <Icon name="heart" />
              <span className="action__label">Favoritos</span>
              {wishlist.length > 0 && <span className="action__badge">{wishlist.length}</span>}
            </Link>

            <button className="action" onClick={() => setDrawerOpen(true)} aria-label="Abrir carrito">
              <Icon name="cart" />
              <span className="action__label">Cesta</span>
              {count > 0 && <span className="action__badge">{count}</span>}
            </button>
          </div>
        </div>

        <nav className={`catnav ${catOpen ? "is-open" : ""}`} aria-label="Secciones">
          <div className="container catnav__inner">
            <Link
              className={`catnav__link ${path === "/categoria/ofertas" ? "is-active" : ""}`}
              href="/categoria/ofertas"
              onClick={() => setCatOpen(false)}
            >
              Ofertas
            </Link>
            {NAV.slice(1).map((item) => (
              <Link
                key={item.href}
                className={`catnav__link ${path === item.href ? "is-active" : ""}`}
                href={item.href}
                onClick={() => setCatOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>
    </>
  );
}
