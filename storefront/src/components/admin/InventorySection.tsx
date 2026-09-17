"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Product } from "@/lib/types";
import { patch } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { Icon } from "@/components/Icon";
import { loadAdminProducts } from "./ProductsSection";

export default function InventorySection() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [q, setQ] = useState("");
  const [draft, setDraft] = useState<Record<number, number>>({});
  const [forbidden, setForbidden] = useState(false);

  const load = useCallback(() => {
    loadAdminProducts()
      .then(setProducts)
      .catch((e) => {
        if (e?.status === 403) setForbidden(true);
        else setProducts([]);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (products ?? []).filter((p) => !needle || p.name.toLowerCase().includes(needle));
  }, [products, q]);

  const saveStock = async (p: Product) => {
    const value = draft[p.id];
    if (value === undefined) return;
    try {
      await patch(`/admin/products/${p.id}/stock`, { stock: value }, { auth: true });
      toast(`Stock de «${p.name}» actualizado a ${value}`);
      setDraft((d) => {
        const next = { ...d };
        delete next[p.id];
        return next;
      });
      load();
    } catch (e) {
      toast(e instanceof Error ? `Error: ${e.message}` : "No se pudo actualizar");
    }
  };

  if (forbidden) {
    return (
      <div className="acard" style={{ textAlign: "center", padding: 48 }}>
        <Icon name="shield" size={40} className="pd__fallback" />
        <h2 style={{ fontFamily: "var(--font-display)", marginTop: 10 }}>Sin permiso</h2>
        <p style={{ color: "var(--adm-muted)" }}>Tu rol no puede ajustar inventario.</p>
      </div>
    );
  }

  const lowStockCount = (products ?? []).filter((p) => p.stock < 10).length;

  return (
    <>
      <div className="admin-toolbar">
        <input type="search" placeholder="Buscar producto…" value={q} onChange={(e) => setQ(e.target.value)} />
        {products && (
          <span className="notif-pill" style={{ marginBottom: 0 }}>
            <Icon name="bell" size={14} /> {lowStockCount} producto(s) con stock bajo (&lt;10)
          </span>
        )}
      </div>

      <div className="acard admin-table-wrap">
        {products === null ? (
          <p className="grid__empty">Cargando inventario…</p>
        ) : (
          <table className="ptable admin-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Estado</th>
                <th>Stock actual</th>
                <th>Nuevo stock</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td>
                    <span className="rowlink">{p.name}</span>
                    <br />
                    <small style={{ color: "var(--adm-muted)" }}>SKU: {p.sku || "—"}</small>
                  </td>
                  <td>
                    <span className={`status ${p.stock === 0 ? "status--bad" : p.stock < 10 ? "status--warn" : "status--ok"}`}>
                      {p.stock === 0 ? "Agotado" : p.stock < 10 ? "Stock bajo" : "OK"}
                    </span>
                  </td>
                  <td className="num">{p.stock}</td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      value={draft[p.id] ?? p.stock}
                      onChange={(e) => setDraft((d) => ({ ...d, [p.id]: parseInt(e.target.value, 10) || 0 }))}
                      aria-label={`Nuevo stock de ${p.name}`}
                    />
                  </td>
                  <td>
                    <button
                      className="btn btn--primary btn--sm"
                      disabled={draft[p.id] === undefined || draft[p.id] === p.stock}
                      onClick={() => saveStock(p)}
                    >
                      Guardar
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
