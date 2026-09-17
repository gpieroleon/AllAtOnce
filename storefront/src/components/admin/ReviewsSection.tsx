"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminReviews, Product, Review } from "@/lib/types";
import { get, put } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { Icon, Stars } from "@/components/Icon";
import { loadAdminProducts } from "./ProductsSection";

export default function ReviewsSection() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState<number | null>(null);
  const [data, setData] = useState<AdminReviews | null>(null);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    loadAdminProducts()
      .then((list) => {
        setProducts(list);
        if (list.length > 0) setProductId(list[0].id);
      })
      .catch(() => setProducts([]));
  }, []);

  const load = useCallback(() => {
    if (productId == null) return;
    get<AdminReviews>(`/admin/reviews?productId=${productId}`, { auth: true })
      .then(setData)
      .catch((e) => {
        if (e?.status === 403) setForbidden(true);
        else setData({ list: [], hidden: [] });
      });
  }, [productId]);

  useEffect(() => {
    load();
  }, [load]);

  const hide = async (indexes: number[], hidden: boolean) => {
    if (productId == null) return;
    try {
      await put("/admin/reviews/hide", { productId, indexes }, { auth: true });
      toast(hidden ? "Reseña(s) ocultadas" : "Reseña(s) restauradas");
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
        <p style={{ color: "var(--adm-muted)" }}>Tu rol no puede moderar reseñas.</p>
      </div>
    );
  }

  const hiddenSet = new Set(data?.hidden ?? []);

  return (
    <>
      <div className="admin-toolbar">
        <select
          value={productId ?? ""}
          onChange={(e) => setProductId(Number(e.target.value))}
          aria-label="Seleccionar producto"
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        {data && (
          <span className="notif-pill" style={{ marginBottom: 0 }}>
            <Icon name="starO" size={14} /> {data.list.length} reseñas · {data.hidden.length} ocultas
          </span>
        )}
      </div>

      <div className="acard">
        {data === null ? (
          <p className="grid__empty">Cargando reseñas…</p>
        ) : data.list.length === 0 ? (
          <p className="grid__empty">Este producto no tiene reseñas.</p>
        ) : (
          data.list.map((r: Review, i: number) => (
            <div
              key={i}
              className="pd__rev"
              style={{ opacity: hiddenSet.has(i) ? 0.45 : 1 }}
            >
              <div className="pd__rev-head">
                <span className="pd__rev-avatar">{r.name.charAt(0)}</span>
                <div>
                  <p className="pd__rev-name">{r.name}</p>
                  <p className="pd__rev-date">{r.date}</p>
                </div>
                {r.verified && (
                  <span className="pd__rev-verified">
                    <Icon name="check" size={13} /> Compra verificada
                  </span>
                )}
                {hiddenSet.has(i) && <span className="status status--bad">Oculta</span>}
                <span style={{ marginLeft: "auto" }}>
                  <button
                    className="btn btn--outline btn--sm"
                    onClick={() => hide([i], !hiddenSet.has(i))}
                  >
                    {hiddenSet.has(i) ? "Restaurar" : "Ocultar"}
                  </button>
                </span>
              </div>
              <Stars rating={r.rating} />
              <p className="pd__rev-title">{r.title}</p>
              <p className="pd__rev-text">{r.text}</p>
            </div>
          ))
        )}
      </div>
    </>
  );
}
