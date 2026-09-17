"use client";

import { useEffect, useState } from "react";
import type { ShipMethod } from "@/lib/types";
import { get, put } from "@/lib/api";
import { fmt } from "@/lib/format";
import { useToast } from "@/context/ToastContext";
import { Icon } from "@/components/Icon";

export default function ShippingSection() {
  const { toast } = useToast();
  const [methods, setMethods] = useState<ShipMethod[] | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    get<ShipMethod[]>("/shipping")
      .then(setMethods)
      .catch(() => setForbidden(true));
  }, []);

  if (forbidden) {
    return (
      <div className="acard" style={{ textAlign: "center", padding: 48 }}>
        <Icon name="shield" size={40} className="pd__fallback" />
        <h2 style={{ fontFamily: "var(--font-display)", marginTop: 10 }}>Sin permiso</h2>
        <p style={{ color: "var(--adm-muted)" }}>Los métodos de envío solo los edita un superadministrador.</p>
      </div>
    );
  }

  if (!methods) return <p className="grid__empty">Cargando métodos de envío…</p>;

  const set = (i: number, patch: Partial<ShipMethod>) =>
    setMethods((prev) => prev?.map((m, j) => (j === i ? { ...m, ...patch } : m)) ?? null);

  const save = async () => {
    setSaving(true);
    try {
      await put("/shipping", methods, { auth: true });
      toast("Métodos de envío guardados");
    } catch (e) {
      toast(e instanceof Error ? `Error: ${e.message}` : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="acard" style={{ marginBottom: 16 }}>
        <h2>
          Métodos de envío <small>PUT /api/shipping</small>
        </h2>
        {methods.map((m, i) => (
          <div key={m.id} className="shipopt" style={{ cursor: "default" }}>
            <input
              type="checkbox"
              checked={m.activo}
              onChange={(e) => set(i, { activo: e.target.checked })}
              aria-label={`Activar ${m.nombre}`}
            />
            <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
              <label style={{ fontSize: ".74rem", color: "var(--adm-muted)" }}>
                Nombre
                <input type="text" value={m.nombre} onChange={(e) => set(i, { nombre: e.target.value })} style={{ width: "100%", marginTop: 4 }} />
              </label>
              <label style={{ fontSize: ".74rem", color: "var(--adm-muted)" }}>
                Descripción
                <input type="text" value={m.desc} onChange={(e) => set(i, { desc: e.target.value })} style={{ width: "100%", marginTop: 4 }} />
              </label>
              <label style={{ fontSize: ".74rem", color: "var(--adm-muted)" }}>
                Precio (€)
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={m.precio}
                  onChange={(e) => set(i, { precio: parseFloat(e.target.value) || 0 })}
                  style={{ width: "100%", marginTop: 4 }}
                />
              </label>
              <label style={{ fontSize: ".74rem", color: "var(--adm-muted)" }}>
                Gratis desde (€, vacío = nunca)
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={m.gratisDesde ?? ""}
                  onChange={(e) =>
                    set(i, { gratisDesde: e.target.value === "" ? null : parseFloat(e.target.value) })
                  }
                  style={{ width: "100%", marginTop: 4 }}
                />
              </label>
              <label style={{ fontSize: ".74rem", color: "var(--adm-muted)" }}>
                Suplemento (€)
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={m.extra ?? 0}
                  onChange={(e) => set(i, { extra: parseFloat(e.target.value) || 0 })}
                  style={{ width: "100%", marginTop: 4 }}
                />
              </label>
              <label style={{ fontSize: ".74rem", color: "var(--adm-muted)" }}>
                Días de entrega
                <input
                  type="number"
                  min="0"
                  value={m.dias}
                  onChange={(e) => set(i, { dias: parseInt(e.target.value, 10) || 0 })}
                  style={{ width: "100%", marginTop: 4 }}
                />
              </label>
            </div>
            <span className="payopt__price">{m.precio === 0 ? "Gratis" : fmt.format(m.precio)}</span>
          </div>
        ))}
        <button className="btn btn--primary btn--sm" onClick={save} disabled={saving}>
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
    </>
  );
}
