"use client";

import { useEffect, useState } from "react";
import type { PayMethod } from "@/lib/types";
import { get, put } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { Icon } from "@/components/Icon";

export default function PaymentsSection() {
  const { toast } = useToast();
  const [methods, setMethods] = useState<PayMethod[] | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    get<PayMethod[]>("/payments")
      .then(setMethods)
      .catch(() => setForbidden(true));
  }, []);

  if (forbidden) {
    return (
      <div className="acard" style={{ textAlign: "center", padding: 48 }}>
        <Icon name="shield" size={40} className="pd__fallback" />
        <h2 style={{ fontFamily: "var(--font-display)", marginTop: 10 }}>Sin permiso</h2>
        <p style={{ color: "var(--adm-muted)" }}>Los métodos de pago solo los edita un superadministrador.</p>
      </div>
    );
  }

  if (!methods) return <p className="grid__empty">Cargando métodos de pago…</p>;

  const set = (i: number, patch: Partial<PayMethod>) =>
    setMethods((prev) => prev?.map((m, j) => (j === i ? { ...m, ...patch } : m)) ?? null);

  const save = async () => {
    setSaving(true);
    try {
      await put("/payments", methods, { auth: true });
      toast("Métodos de pago guardados");
    } catch (e) {
      toast(e instanceof Error ? `Error: ${e.message}` : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="acard">
      <h2>
        Métodos de pago <small>PUT /api/payments</small>
      </h2>
      {methods.map((m, i) => (
        <div key={m.id} className="payopt" style={{ cursor: "default" }}>
          <input
            type="checkbox"
            checked={m.activo}
            onChange={(e) => set(i, { activo: e.target.checked })}
            aria-label={`Activar ${m.nombre}`}
          />
          <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10 }}>
            <label style={{ fontSize: ".74rem", color: "var(--adm-muted)" }}>
              Nombre
              <input type="text" value={m.nombre} onChange={(e) => set(i, { nombre: e.target.value })} style={{ width: "100%", marginTop: 4 }} />
            </label>
            <label style={{ fontSize: ".74rem", color: "var(--adm-muted)" }}>
              Descripción
              <input type="text" value={m.desc} onChange={(e) => set(i, { desc: e.target.value })} style={{ width: "100%", marginTop: 4 }} />
            </label>
          </div>
        </div>
      ))}
      <button className="btn btn--primary btn--sm" onClick={save} disabled={saving}>
        {saving ? "Guardando…" : "Guardar cambios"}
      </button>
    </div>
  );
}
