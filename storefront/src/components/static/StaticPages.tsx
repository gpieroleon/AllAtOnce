"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";

export function StaticShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="page">
      <div className="container page--narrow">
        <nav className="crumbs" aria-label="Migas de pan">
          <Link href="/">Inicio</Link>
          <span aria-hidden="true">›</span>
          <span>{title}</span>
        </nav>
        <div className="page-head">
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ContactoPage() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ nombre: "", email: "", asunto: "", mensaje: "" });

  return (
    <StaticShell title="Contacto" subtitle="Estamos aquí para ayudarte, de 9:00 a 21:00 todos los días.">
      <div className="contact-grid">
        <div className="box">
          <h2>Escríbenos</h2>
          {sent ? (
            <div role="status">
              <div className="auth__alert" style={{ borderColor: "#BBF7D0", background: "#F0FDF4" }}>
                <span style={{ color: "var(--green)", flexShrink: 0 }}>
                  <Icon name="check" size={22} />
                </span>
                <div>
                  <strong style={{ color: "var(--green)" }}>Mensaje enviado</strong>
                  <p style={{ color: "#166534" }}>
                    Gracias por escribirnos. Te responderemos en menos de 24 horas laborables.
                  </p>
                </div>
              </div>
              <button className="btn btn--outline btn--sm" onClick={() => setSent(false)}>
                Enviar otro mensaje
              </button>
            </div>
          ) : (
            <form
              className="form-grid"
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
            >
              <div className="field">
                <label htmlFor="cnombre">Nombre</label>
                <input
                  id="cnombre"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="cemail">Correo</label>
                <input
                  id="cemail"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div className="field field--full">
                <label htmlFor="casunto">Asunto</label>
                <input
                  id="casunto"
                  value={form.asunto}
                  onChange={(e) => setForm({ ...form, asunto: e.target.value })}
                  required
                />
              </div>
              <div className="field field--full">
                <label htmlFor="cmensaje">Mensaje</label>
                <textarea
                  id="cmensaje"
                  value={form.mensaje}
                  onChange={(e) => setForm({ ...form, mensaje: e.target.value })}
                  required
                />
              </div>
              <div className="field field--full">
                <button className="btn btn--primary" type="submit">
                  Enviar mensaje
                </button>
              </div>
            </form>
          )}
        </div>

        <div>
          <div className="info-card">
            <span className="info-card__icon">
              <Icon name="mail" size={20} />
            </span>
            <div>
              <strong>Correo</strong>
              <p>hola@allatonce.com</p>
            </div>
          </div>
          <div className="info-card">
            <span className="info-card__icon">
              <Icon name="phone" size={20} />
            </span>
            <div>
              <strong>Teléfono</strong>
              <p>+34 900 123 456</p>
            </div>
          </div>
          <div className="info-card">
            <span className="info-card__icon">
              <Icon name="pin" size={20} />
            </span>
            <div>
              <strong>Oficinas</strong>
              <p>Calle del Comercio 12, 28004 Madrid</p>
            </div>
          </div>
          <div className="info-card">
            <span className="info-card__icon">
              <Icon name="clock" size={20} />
            </span>
            <div>
              <strong>Horario</strong>
              <p>Lunes a domingo, 9:00–21:00</p>
            </div>
          </div>
        </div>
      </div>
    </StaticShell>
  );
}

export function SobreNosotrosPage() {
  return (
    <StaticShell
      title="Sobre nosotros"
      subtitle="Nacimos con una idea sencilla: que comprar de todo no debería costar de todo."
    >
      <div className="box">
        <div className="prose">
          <h3>Nuestra historia</h3>
          <p>
            All At Once empezó en 2024 como una tienda pequeña de gadgets y creció hasta cubrir
            tecnología, moda, hogar, belleza y accesorios. Seleccionamos cada producto a mano,
            negociamos precios directos con fabricantes y cuidamos el envío como si fuera para
            nosotros.
          </p>
          <h3>Cómo trabajamos</h3>
          <p>
            Catálogo corto y bueno: preferimos 12 productos excelentes antes que 12.000
            mediocres. Por eso casi todo lo que ves tiene valoraciones de 4,4 estrellas o más.
          </p>
          <div className="values">
            <div className="stat-card">
              <b>48 h</b>
              <span>Envío medio en península</span>
            </div>
            <div className="stat-card">
              <b>4,7/5</b>
              <span>Valoración media de clientes</span>
            </div>
            <div className="stat-card">
              <b>30 días</b>
              <span>Devoluciones gratuitas</span>
            </div>
          </div>
          <h3>Equipo</h3>
          <p>
            Somos un equipo pequeño de Madrid: logística, soporte y tecnología bajo el mismo
            techo. Si nos escribes, te contesta una persona, no un robot.
          </p>
        </div>
      </div>
    </StaticShell>
  );
}

export function PoliticasPage() {
  return (
    <StaticShell
      title="Políticas de la tienda"
      subtitle="Envíos, devoluciones, privacidad y condiciones de uso, explicadas sin letra pequeña."
    >
      <div className="prose">
        <details className="acc" open>
          <summary>Envíos y plazos</summary>
          <div className="acc__body">
            <p>
              Enviamos a toda España. El envío estándar (3–5 días laborables) cuesta 4,99 € y es
              gratis a partir de 75 € de compra. El envío exprés 24/48 h cuesta 9,99 €. Todos los
              pedidos incluyen número de seguimiento.
            </p>
          </div>
        </details>
        <details className="acc">
          <summary>Devoluciones</summary>
          <div className="acc__body">
            <p>
              Tienes 30 días naturales desde la recepción para devolver cualquier producto sin
              dar explicaciones. Te devolvemos el importe completo por el mismo método de pago en
              un máximo de 5 días laborables desde que recogemos el paquete.
            </p>
          </div>
        </details>
        <details className="acc">
          <summary>Privacidad</summary>
          <div className="acc__body">
            <p>
              Solo usamos tus datos para procesar pedidos y mejorar la tienda. No vendemos ni
              compartimos datos con terceros con fines publicitarios. Puedes solicitar la
              exportación o el borrado de tus datos escribiendo a hola@allatonce.com.
            </p>
          </div>
        </details>
        <details className="acc">
          <summary>Condiciones de uso</summary>
          <div className="acc__body">
            <p>
              Al comprar en All At Once aceptas estas condiciones. Los precios incluyen IVA.
              Las ofertas flash están sujetas a stock disponible y pueden finalizar antes de la
              cuenta atrás si se agota el inventario.
            </p>
          </div>
        </details>
        <details className="acc">
          <summary>Guía de tallas orientativa</summary>
          <div className="acc__body">
            <table>
              <thead>
                <tr>
                  <th>Talla</th>
                  <th>Pecho (cm)</th>
                  <th>Cintura (cm)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>S</td>
                  <td>92–96</td>
                  <td>76–80</td>
                </tr>
                <tr>
                  <td>M</td>
                  <td>97–101</td>
                  <td>81–85</td>
                </tr>
                <tr>
                  <td>L</td>
                  <td>102–107</td>
                  <td>86–92</td>
                </tr>
                <tr>
                  <td>XL</td>
                  <td>108–114</td>
                  <td>93–100</td>
                </tr>
              </tbody>
            </table>
          </div>
        </details>
      </div>
    </StaticShell>
  );
}
