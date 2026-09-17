"use client";

import { useCallback, useEffect, useState } from "react";
import type { Coupon } from "@/lib/types";
import { del, get, post } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { Icon } from "@/components/Icon";

export default function CouponsSection() {
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[] | null>(null);
  const [code, setCode] = useState("");
  const [tipo, setTipo] = useState<"pct" | "fijo">("pct");
  const [valor, setValor] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [forbidden, setForbidden] = useState(false);

  const load = useCallback(() => {
    get<Coupon[]>("/admin/coupons", { auth: true })
      .then(setCoupons)
      .catch((e) => {
        if (e?.status === 403) setForbidden(true);
        else setCoupons([]);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = parseFloat(valor);
    if (!code.trim() || !v) return;
    try {
      await post("/admin/coupons", { code: code.trim().toUpperCase(), tipo, valor: v, descripcion: descripcion.trim() }, { auth: true });
      toast("Cupón creado");
      setCode("");
      setValor("");
      setDescripcion("");
      load();
    } catch (e2) {
      toast(e2 instanceof Error ? `Error: ${e2.message}` : "No se pudo crear el cupón");
    }
  };

  const remove = async (c: string) => {
    try {
      await del(`/admin/coupons/${encodeURIComponent(c)}`, { auth: true });
      toast("Cupón eliminado");
      load();
    } catch (e) {
      toast(e instanceof Error ? `Error: ${e.message}` : "No se pudo eliminar");
    }
  };

  if (forbidden) {
    return (
      <div className="acard" style={{ textAlign: "center", padding: 48 }}>
        <Icon name="shield" size={40} className="pd__fallback" />
        <h2 style={{ fontFamily: "var(--font-display)", marginTop: 10 }}>Sin permiso</h2>
        <p style={{ color: "var(--adm-muted)" }}>Tu rol no puede gestionar cupones.</p>
      </div>
    );
  }

  return (
    <>
      <div className="acard" style={{ marginBottom: 16 }}>
        <h2>Nuevo cupón</h2>
        <form className="admin-toolbar" onSubmit={create}>
          <input type="text" placeholder="CÓDIGO" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} required />
          <select value={tipo} onChange={(e) => setTipo(e.target.value as "pct" | "fijo")} aria-label="Tipo de descuento">
            <option value="pct">Porcentaje (%)</option>
            <option value="fijo">Importe fijo (€)</option>
          </select>
          <input
            type="number"
            min="0"
            step={tipo === "pct" ? "1" : "0.01"}
            max={tipo === "pct" ? 100 : undefined}
            placeholder={tipo === "pct" ? "10" : "5.00"}
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            required
            style={{ width: 110 }}
          />
          <input type="text" placeholder="Descripción (opcional)" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
          <button className="btn btn--primary btn--sm" type="submit">
            Crear cupón
          </button>
        </form>
      </div>

      <div className="acard admin-table-wrap">
        {coupons === null ? (
          <p className="grid__empty">Cargando cupones…</p>
        ) : coupons.length === 0 ? (
          <p className="grid__empty">No hay cupones creados.</p>
        ) : (
          <table className="ptable admin-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Descuento</th>
                <th>Descripción</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.code}>
                  <td>
                    <span className="rowlink">{c.code}</span>
                  </td>
                  <td>
                    <span className="status status--info">{c.tipo === "pct" ? `-${c.valor}%` : `-${c.valor} €`}</span>
                  </td>
                  <td>{c.descripcion || "—"}</td>
                  <td>
                    <button className="btn btn--outline btn--sm" style={{ color: "#B91C1C" }} onClick={() => remove(c.code)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
