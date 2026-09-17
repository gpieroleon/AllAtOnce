"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import { Logo } from "@/components/SiteHeader";
import { Icon } from "@/components/Icon";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get("from") || "/";
  const { login, register, user, ready } = useAuth();

  const [mode, setMode] = useState<"email" | "password" | "register">(
    params.get("nuevo") ? "register" : "email"
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Ya autenticado: clientes → destino, equipo → admin
  useEffect(() => {
    if (ready && user) {
      router.replace(user.role !== "cliente" ? "/admin" : from);
    }
  }, [ready, user, router, from]);

  const submitEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Introduce una dirección de correo válida.");
      return;
    }
    setMode("password");
  };

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { user: u } = await login(email, password);
      if (u.role !== "cliente") {
        router.push("/admin");
      } else {
        router.push(from);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo iniciar sesión. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const submitRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 2) {
      setError("Escribe tu nombre completo.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setLoading(true);
    try {
      await register(name.trim(), email, password);
      router.push(from);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo crear la cuenta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth">
        <button className="auth__backbtn" onClick={() => router.back()} type="button">
          <Icon name="chevL" /> Atrás
        </button>
        <div className="auth__logo">
          <Logo />
        </div>

        <div className="auth__card">
          {error && (
            <div className="auth__alert" role="alert">
              <Icon name="close" />
              <div>
                <strong>Hay un problema</strong>
                <p>{error}</p>
              </div>
            </div>
          )}

          {mode === "email" && (
            <form onSubmit={submitEmail}>
              <h1 className="auth__title">Iniciar sesión</h1>
              <label className="auth__label" htmlFor="email">
                Dirección de correo
              </label>
              <input
                id="email"
                className="auth__input"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
              <button className="auth__btn" type="submit">
                Continuar
              </button>
              <p className="auth__legal">
                Al continuar, aceptas las <Link href="/politicas">condiciones de uso</Link> y el{" "}
                <Link href="/politicas">aviso de privacidad</Link> de All At Once.
              </p>
            </form>
          )}

          {mode === "password" && (
            <form onSubmit={submitPassword}>
              <h1 className="auth__title">Iniciar sesión</h1>
              <p className="auth__identity">
                {email}
                <button type="button" className="auth__change" onClick={() => setMode("email")}>
                  Cambiar
                </button>
              </p>
              <label className="auth__label" htmlFor="password">
                Contraseña
              </label>
              <input
                id="password"
                className="auth__input"
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
              <label className="auth__check">
                <input type="checkbox" checked={showPw} onChange={(e) => setShowPw(e.target.checked)} />
                Mostrar contraseña
              </label>
              <button className="auth__btn" type="submit" disabled={loading}>
                {loading ? "Iniciando sesión…" : "Iniciar sesión"}
              </button>
              <p className="auth__back">
                <Link href="/recuperar">¿Has olvidado la contraseña?</Link>
              </p>
            </form>
          )}

          {mode === "register" && (
            <form onSubmit={submitRegister}>
              <h1 className="auth__title">Crear cuenta</h1>
              <label className="auth__label" htmlFor="name">
                Nombre y apellidos
              </label>
              <input
                id="name"
                className="auth__input"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <label className="auth__label" htmlFor="email2">
                Dirección de correo
              </label>
              <input
                id="email2"
                className="auth__input"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <label className="auth__label" htmlFor="password2">
                Contraseña (mín. 6 caracteres)
              </label>
              <input
                id="password2"
                className="auth__input"
                type={showPw ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <label className="auth__check">
                <input type="checkbox" checked={showPw} onChange={(e) => setShowPw(e.target.checked)} />
                Mostrar contraseña
              </label>
              <button className="auth__btn" type="submit" disabled={loading}>
                {loading ? "Creando cuenta…" : "Crear tu cuenta de All At Once"}
              </button>
              <p className="auth__legal">
                Al crear la cuenta aceptas las <Link href="/politicas">condiciones de uso</Link>.
              </p>
            </form>
          )}

          {mode !== "register" && (
            <>
              <p className="auth__divider">¿Nuevo en All At Once?</p>
              <button className="auth__btn auth__btn--ghost" onClick={() => setMode("register")}>
                Crea tu cuenta de All At Once
              </button>
            </>
          )}
          {mode === "register" && (
            <p className="auth__back">
              <button type="button" className="link-btn" onClick={() => setMode("email")}>
                ← Volver a iniciar sesión
              </button>
            </p>
          )}
        </div>

        <div className="auth__demo">
          <p>Cuentas de demostración del contrato API:</p>
          <div className="auth__demo-creds">
            <code>demo@allatonce.com</code>
            <code>AllAtOnce#2026</code>
          </div>
          <p style={{ marginBottom: 8 }}>Equipo (acceso al panel):</p>
          <div className="auth__demo-creds">
            <code>equipo@allatonce.com</code>
            <code>Equipo2026!</code>
          </div>
        </div>

        <div className="auth__foot">
          <p>
            <Link href="/politicas">Condiciones de uso</Link> · <Link href="/politicas">Privacidad</Link> ·{" "}
            <Link href="/contacto">Ayuda</Link>
          </p>
          <p>© 2026 All At Once</p>
        </div>
      </div>
    </div>
  );
}
