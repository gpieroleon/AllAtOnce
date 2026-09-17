"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/SiteHeader";
import { Icon } from "@/components/Icon";

export default function RecuperarPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

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
          <h1 className="auth__title">¿Has olvidado la contraseña?</h1>

          {!sent ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
            >
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
                required
              />
              <button className="auth__btn" type="submit">
                Enviar instrucciones
              </button>
              <p className="auth__legal">
                Te enviaremos un correo con los pasos para restablecer tu contraseña. El enlace caduca a las
                24 horas.
              </p>
            </form>
          ) : (
            <div role="status">
              <div className="auth__alert" style={{ borderColor: "#BBF7D0", background: "#F0FDF4" }}>
                <span style={{ color: "var(--green)", flexShrink: 0 }}>
                  <Icon name="check" size={22} />
                </span>
                <div>
                  <strong style={{ color: "var(--green)" }}>Correo enviado</strong>
                  <p style={{ color: "#166534" }}>
                    Si existe una cuenta asociada a <b>{email}</b>, recibirás en unos minutos las
                    instrucciones para restablecer tu contraseña.
                  </p>
                </div>
              </div>
              <p className="auth__legal">
                Revisa también la carpeta de spam. Si no llega, vuelve a intentarlo o{" "}
                <Link href="/contacto">contacta con nosotros</Link>.
              </p>
              <button className="auth__btn auth__btn--ghost" onClick={() => router.push("/login")}>
                Volver a iniciar sesión
              </button>
            </div>
          )}
        </div>

        <div className="auth__foot">
          <p>
            <Link href="/politicas">Condiciones de uso</Link> · <Link href="/politicas">Privacidad</Link>
          </p>
          <p>© 2026 All At Once</p>
        </div>
      </div>
    </div>
  );
}
