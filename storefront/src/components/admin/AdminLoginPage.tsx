"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/SiteHeader";
import { Icon } from "@/components/Icon";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, logout, user, ready, isAdmin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Ya hay sesión de staff → directo al panel
  useEffect(() => {
    if (ready && isAdmin) router.replace("/admin");
  }, [ready, isAdmin, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { user: u } = await login(email, password);
      if (u.role === "cliente") {
        // Acceso de equipo: una cuenta cliente no vale aquí y no se mantiene su sesión
        logout();
        setPassword("");
        setError("Credenciales de administrador no válidas.");
        return;
      }
      router.push("/admin");
    } catch {
      setError("Credenciales de administrador no válidas.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page adm-login">
      <div className="auth">
        {/* Hueco invisible: mantiene la posición del bloque al no haber botón Atrás */}
        <button className="auth__backbtn" style={{ visibility: "hidden" }} disabled tabIndex={-1} aria-hidden="true" type="button">
          <Icon name="chevL" /> Atrás
        </button>
        <div className="auth__logo">
          <Logo light />
        </div>

        <div className="auth__card">
          <h1 className="auth__title">Panel de administración</h1>

          {error && (
            <div className="auth__alert" role="alert">
              <svg
                viewBox="0 0 24 24"
                width="22"
                height="22"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                style={{ flexShrink: 0, marginTop: 1, color: "#DC2626" }}
              >
                <path d="M12 9v4M12 17h.01" />
                <path d="M10.3 3.9 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
              </svg>
              <div>
                <strong>Acceso denegado</strong>
                <p>{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={submit} noValidate={false}>
            <label className="auth__label" htmlFor="admEmail">
              Email
            </label>
            <input
              className="auth__input"
              type="email"
              id="admEmail"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value.replace(/\s+/g, ""))}
              required
              autoFocus
            />
            <label className="auth__label" htmlFor="admPass">
              Contraseña
            </label>
            <input
              className="auth__input"
              type="password"
              id="admPass"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value.replace(/\s+/g, ""))}
              required
            />
            <button className="auth__btn" type="submit" disabled={loading}>
              {loading ? "Comprobando…" : "Entrar al panel"}
            </button>
          </form>
        </div>

        <div className="auth__foot">
          <p>© 2026 All At Once · Acceso restringido al equipo</p>
          <p>
            ¿Eres cliente?{" "}
            <Link href="/login" style={{ textDecoration: "underline" }}>
              Inicia sesión en la tienda
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
