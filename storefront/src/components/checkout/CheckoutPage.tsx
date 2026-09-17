"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Order, PayMethod, ShipMethod } from "@/lib/types";
import { get, post } from "@/lib/api";
import { fmt } from "@/lib/format";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { Icon } from "@/components/Icon";

interface FormState {
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  provincia: string;
  cp: string;
  pais: string;
}

const EMPTY: FormState = {
  nombre: "",
  email: "",
  telefono: "",
  direccion: "",
  ciudad: "",
  provincia: "",
  cp: "",
  pais: "España",
};

const STEPS = ["Dirección de envío", "Envío y pago", "Revisión del pedido"];

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { lines, subtotal, count, clear, catalogReady } = useCart();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [shipping, setShipping] = useState<ShipMethod[]>([]);
  const [payments, setPayments] = useState<PayMethod[]>([]);
  const [shipId, setShipId] = useState<string>("");
  const [payId, setPayId] = useState<string>("");
  const [terms, setTerms] = useState(false);
  const [coupon, setCoupon] = useState<{ code: string; amount: number } | null>(null);
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Precargar datos del usuario y cupón guardado
  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        nombre: f.nombre || user.name || "",
        email: f.email || user.email || "",
        telefono: f.telefono || user.phone || "",
      }));
    }
  }, [user]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("aao_coupon");
      if (raw) setCoupon(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  // Cargar métodos al llegar al paso 2
  useEffect(() => {
    if (step !== 1) return;
    get<ShipMethod[]>("/shipping").then((s) => {
      setShipping(s);
      setShipId((prev) => prev || s[0]?.id || "");
    }).catch(() => setShipping([]));
    get<PayMethod[]>("/payments").then((p) => {
      setPayments(p);
      setPayId((prev) => prev || p[0]?.id || "");
    }).catch(() => setPayments([]));
  }, [step]);

  const shipMethod = useMemo(
    () => shipping.find((s) => s.id === shipId) ?? null,
    [shipping, shipId]
  );

  const discount = Math.min(coupon?.amount ?? 0, subtotal);
  const effectiveSubtotal = subtotal - discount;
  const shipBase = shipMethod?.precio ?? 0;
  const shipExtra = shipMethod?.extra ?? 0;
  const shipFree =
    shipMethod?.gratisDesde != null && effectiveSubtotal >= shipMethod.gratisDesde;
  const shipCost = shipMethod ? (shipFree ? shipExtra : shipBase + shipExtra) : 0;
  const total = effectiveSubtotal + shipCost;

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const validateStep1 = (): boolean => {
    const er: Partial<Record<keyof FormState, string>> = {};
    if (form.nombre.trim().length < 3) er.nombre = "Escribe tu nombre completo.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) er.email = "Correo no válido.";
    if (form.telefono.trim().length < 6) er.telefono = "Teléfono no válido.";
    if (form.direccion.trim().length < 4) er.direccion = "Dirección incompleta.";
    if (form.ciudad.trim().length < 2) er.ciudad = "Ciudad obligatoria.";
    if (form.provincia.trim().length < 2) er.provincia = "Provincia obligatoria.";
    if (!/^\d{4,6}$/.test(form.cp.trim())) er.cp = "Código postal no válido.";
    if (form.pais.trim().length < 2) er.pais = "País obligatorio.";
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const placeOrder = async () => {
    setPlacing(true);
    setOrderError(null);
    try {
      const hasToken = !!localStorage.getItem("aao_token");
      const order = await post<Order>(
        "/orders",
        {
          items: lines.map((l) => ({ id: l.id, qty: l.qty })),
          address: {
            nombre: form.nombre,
            email: form.email,
            telefono: form.telefono,
            direccion: form.direccion,
            ciudad: form.ciudad,
            provincia: form.provincia,
            cp: form.cp,
            pais: form.pais,
          },
          shippingId: shipId,
          paymentId: payId,
          ...(coupon ? { coupon: coupon.code } : {}),
        },
        hasToken ? { auth: true } : {}
      );
      clear();
      localStorage.removeItem("aao_coupon");
      sessionStorage.setItem("aao_last_order", JSON.stringify(order));
      router.push(`/confirmacion?id=${encodeURIComponent(order.id)}`);
    } catch (e) {
      setOrderError(e instanceof Error ? e.message : "No se pudo crear el pedido.");
      setPlacing(false);
    }
  };

  if (catalogReady && lines.length === 0) {
    return (
      <div className="page container">
        <div className="box" style={{ textAlign: "center", padding: 48 }}>
          <h2 style={{ fontFamily: "var(--font-display)" }}>Tu cesta está vacía</h2>
          <p style={{ color: "var(--ink-soft)", margin: "10px 0 20px" }}>
            Añade productos antes de tramitar el pedido.
          </p>
          <Link className="btn btn--primary" href="/categoria/all">
            Ir al catálogo
          </Link>
        </div>
      </div>
    );
  }

  const field = (
    key: keyof FormState,
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement> = {},
    full = false
  ) => (
    <div className={`field ${full ? "field--full" : ""} ${errors[key] ? "has-error" : ""}`}>
      <label htmlFor={key}>{label}</label>
      <input id={key} value={form[key]} onChange={set(key)} {...props} />
      <span className="field-err">{errors[key]}</span>
    </div>
  );

  return (
    <div className="page">
      <div className="container page--narrow">
        <nav className="crumbs" aria-label="Migas de pan">
          <Link href="/">Inicio</Link>
          <span aria-hidden="true">›</span>
          <Link href="/carrito">Cesta</Link>
          <span aria-hidden="true">›</span>
          <span>Tramitar pedido</span>
        </nav>

        <h1 style={{ fontFamily: "var(--font-display)" }}>Tramitar pedido</h1>

        <div className="stepper" aria-label="Progreso del pedido">
          {STEPS.map((label, i) => (
            <div key={label} className={`stepper__step ${i === step ? "is-active" : ""} ${i < step ? "is-done" : ""}`}>
              <span className="stepper__dot">{i < step ? <Icon name="check" size={16} /> : i + 1}</span>
              <span className="stepper__label">{label}</span>
              {i < STEPS.length - 1 && <span className="stepper__bar" />}
            </div>
          ))}
        </div>

        {step === 0 && (
          <div className="box">
            <h2>Dirección de envío</h2>
            <div className="form-grid">
              {field("nombre", "Nombre y apellidos", { autoComplete: "name" }, true)}
              {field("email", "Correo electrónico", { type: "email", autoComplete: "email" })}
              {field("telefono", "Teléfono", { type: "tel", autoComplete: "tel" })}
              {field("direccion", "Dirección (calle, número, piso)", { autoComplete: "street-address" }, true)}
              {field("ciudad", "Ciudad", { autoComplete: "address-level2" })}
              {field("provincia", "Provincia", { autoComplete: "address-level1" })}
              {field("cp", "Código postal", { autoComplete: "postal-code" })}
              {field("pais", "País", { autoComplete: "country-name" })}
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 18, flexWrap: "wrap" }}>
              <Link className="btn btn--outline" href="/carrito">
                Volver a la cesta
              </Link>
              <button
                className="btn btn--primary"
                onClick={() => {
                  if (validateStep1()) setStep(1);
                }}
              >
                Continuar con envío y pago
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="box">
            <h2>Método de envío</h2>
            {shipping.length === 0 && <p className="summary-note">Cargando métodos de envío…</p>}
            {shipping.map((s) => (
              <label key={s.id} className={`shipopt ${shipId === s.id ? "is-active" : ""}`}>
                <input type="radio" name="ship" checked={shipId === s.id} onChange={() => setShipId(s.id)} />
                <span>
                  <strong>{s.nombre}</strong>
                  <small>{s.desc}</small>
                </span>
                <span className="payopt__price">
                  {s.gratisDesde != null && effectiveSubtotal >= s.gratisDesde
                    ? "Gratis"
                    : fmt.format(s.precio + (s.extra ?? 0))}
                </span>
              </label>
            ))}

            <h2 style={{ marginTop: 22 }}>Método de pago</h2>
            {payments.map((p) => (
              <label key={p.id} className={`payopt ${payId === p.id ? "is-active" : ""}`}>
                <input type="radio" name="pay" checked={payId === p.id} onChange={() => setPayId(p.id)} />
                <span>
                  <strong>{p.nombre}</strong>
                  <small>{p.desc}</small>
                </span>
              </label>
            ))}

            <div style={{ display: "flex", gap: 12, marginTop: 18, flexWrap: "wrap" }}>
              <button className="btn btn--outline" onClick={() => setStep(0)}>
                Atrás
              </button>
              <button className="btn btn--primary" disabled={!shipId || !payId} onClick={() => setStep(2)}>
                Revisar pedido
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="box">
            <h2>Revisa tu pedido</h2>

            {lines.map((l) => (
              <div className="review-line" key={l.id}>
                <span>
                  {l.qty} × {l.product?.name || `Producto #${l.id}`}
                </span>
                <span>{l.product ? fmt.format(l.product.price * l.qty) : "—"}</span>
              </div>
            ))}
            {coupon && (
              <div className="review-line" style={{ color: "var(--green)" }}>
                <span>Cupón {coupon.code}</span>
                <span>-{fmt.format(discount)}</span>
              </div>
            )}
            <div className="review-line">
              <span>Envío ({shipMethod?.nombre})</span>
              <span>{shipCost === 0 ? "Gratis" : fmt.format(shipCost)}</span>
            </div>
            <div className="review-line" style={{ fontWeight: 700 }}>
              <span>Total (IVA incluido)</span>
              <span>{fmt.format(total)}</span>
            </div>

            <h2 style={{ marginTop: 22 }}>Enviar a</h2>
            <p style={{ fontSize: ".88rem", color: "var(--ink-soft)", lineHeight: 1.6 }}>
              <strong style={{ color: "var(--ink)" }}>{form.nombre}</strong>
              <br />
              {form.direccion}
              <br />
              {form.cp} {form.ciudad}, {form.provincia} ({form.pais})
              <br />
              {form.telefono} · {form.email}
            </p>

            <label className="terms">
              <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
              <span>
                He leído y acepto los <Link href="/politicas">términos y condiciones</Link> y la{" "}
                <Link href="/politicas">política de privacidad</Link> de All At Once.
              </span>
            </label>

            {orderError && (
              <p className="form-alert is-show" role="alert">
                {orderError}
              </p>
            )}

            <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
              <button className="btn btn--outline" onClick={() => setStep(1)}>
                Atrás
              </button>
              <button className="btn btn--primary" disabled={!terms || placing} onClick={placeOrder}>
                {placing ? "Procesando…" : `Confirmar pedido · ${fmt.format(total)}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
