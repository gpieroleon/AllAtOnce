"use client";

import { useEffect, useState } from "react";
import type { Settings } from "@/lib/types";
import { get, put } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { Icon } from "@/components/Icon";

export default function SettingsSection() {
  const { toast } = useToast();
  const [s, setS] = useState<Settings | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    get<Settings>("/settings")
      .then(setS)
      .catch(() => setForbidden(true));
  }, []);

  if (forbidden) {
    return (
      <div className="acard" style={{ textAlign: "center", padding: 48 }}>
        <Icon name="shield" size={40} className="pd__fallback" />
        <h2 style={{ fontFamily: "var(--font-display)", marginTop: 10 }}>Sin permiso</h2>
        <p style={{ color: "var(--adm-muted)" }}>La configuración solo la edita un superadministrador.</p>
      </div>
    );
  }

  if (!s) return <p className="grid__empty">Cargando configuración…</p>;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await put("/settings", s, { auth: true });
      toast("Configuración guardada");
    } catch (e2) {
      toast(e2 instanceof Error ? `Error: ${e2.message}` : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="acard" style={{ maxWidth: 560 }}>
      <h2>
        Configuración de la tienda <small>PUT /api/settings</small>
      </h2>
      <form className="form-grid" onSubmit={save}>
        <div className="field">
          <label htmlFor="s_tienda">Nombre de la tienda</label>
          <input id="s_tienda" value={s.tienda} onChange={(e) => setS({ ...s, tienda: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="s_moneda">Moneda</label>
          <select id="s_moneda" value={s.moneda} onChange={(e) => setS({ ...s, moneda: e.target.value })}>
            <option value="EUR">EUR (€)</option>
            <option value="USD">USD ($)</option>
            <option value="GBP">GBP (£)</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="s_iva">IVA (%)</label>
          <input
            id="s_iva"
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={s.iva}
            onChange={(e) => setS({ ...s, iva: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div className="field">
          <label htmlFor="s_gratis">Envío gratis desde (€)</label>
          <input
            id="s_gratis"
            type="number"
            min="0"
            step="0.01"
            value={s.envioGratis}
            onChange={(e) => setS({ ...s, envioGratis: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div className="field">
          <label htmlFor="s_coste">Coste del envío estándar (€)</label>
          <input
            id="s_coste"
            type="number"
            min="0"
            step="0.01"
            value={s.envioCoste}
            onChange={(e) => setS({ ...s, envioCoste: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div className="field field--full">
          <button className="btn btn--primary btn--sm" type="submit" disabled={saving}>
            {saving ? "Guardando…" : "Guardar configuración"}
          </button>
        </div>
      </form>
    </div>
  );
}
