"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminClient, ClientNote } from "@/lib/types";
import { get, post } from "@/lib/api";
import { fmt, formatDate } from "@/lib/format";
import { useToast } from "@/context/ToastContext";
import { Icon } from "@/components/Icon";

export default function ClientsSection() {
  const { toast } = useToast();
  const [clients, setClients] = useState<AdminClient[] | null>(null);
  const [detail, setDetail] = useState<AdminClient | null>(null);
  const [notes, setNotes] = useState<ClientNote[]>([]);
  const [noteText, setNoteText] = useState("");
  const [forbidden, setForbidden] = useState(false);

  const load = useCallback(() => {
    get<AdminClient[]>("/admin/clients", { auth: true })
      .then(setClients)
      .catch((e) => {
        if (e?.status === 403) setForbidden(true);
        else setClients([]);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openDetail = async (c: AdminClient) => {
    setDetail(c);
    try {
      const n = await get<ClientNote[]>(`/admin/clients/${encodeURIComponent(c.email)}/notes`, { auth: true });
      setNotes(n);
    } catch {
      setNotes([]);
    }
  };

  const addNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detail || !noteText.trim()) return;
    try {
      const saved = await post<ClientNote[]>(
        `/admin/clients/${encodeURIComponent(detail.email)}/notes`,
        { text: noteText.trim() },
        { auth: true }
      );
      setNotes(saved);
      setNoteText("");
      toast("Nota guardada");
    } catch (e2) {
      toast(e2 instanceof Error ? `Error: ${e2.message}` : "No se pudo guardar la nota");
    }
  };

  if (forbidden) {
    return (
      <div className="acard" style={{ textAlign: "center", padding: 48 }}>
        <Icon name="shield" size={40} className="pd__fallback" />
        <h2 style={{ fontFamily: "var(--font-display)", marginTop: 10 }}>Sin permiso</h2>
        <p style={{ color: "var(--adm-muted)" }}>Tu rol no puede ver los clientes.</p>
      </div>
    );
  }

  return (
    <>
      <div className="acard admin-table-wrap">
        {clients === null ? (
          <p className="grid__empty">Cargando clientes…</p>
        ) : (
          <table className="ptable admin-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Registro</th>
                <th style={{ textAlign: "right" }}>Pedidos</th>
                <th style={{ textAlign: "right" }}>Gasto total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.email}>
                  <td>
                    <span className="rowlink">{c.name}</span>
                    <br />
                    <small style={{ color: "var(--adm-muted)" }}>{c.email}</small>
                  </td>
                  <td className="num">{c.reg ? formatDate(c.reg) : "—"}</td>
                  <td className="num" style={{ textAlign: "right" }}>
                    {c.orders}
                  </td>
                  <td className="num" style={{ textAlign: "right" }}>
                    {fmt.format(c.spent)}
                  </td>
                  <td>
                    <button className="btn btn--outline btn--sm" onClick={() => openDetail(c)}>
                      Ficha
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {detail && (
        <div className="overlay is-open" onClick={() => setDetail(null)} style={{ zIndex: 200 }}>
          <div
            className="acard adm-fade"
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "min(560px, 92vw)",
              maxHeight: "86vh",
              overflowY: "auto",
              zIndex: 210,
            }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`Ficha de ${detail.name}`}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h2 style={{ fontFamily: "var(--font-display)", margin: 0 }}>{detail.name}</h2>
              <button className="cart__close" onClick={() => setDetail(null)} aria-label="Cerrar">
                <Icon name="close" />
              </button>
            </div>
            <p style={{ fontSize: ".84rem", color: "var(--adm-muted)" }}>
              {detail.email} · cliente desde {detail.reg ? formatDate(detail.reg) : "—"}
            </p>
            <div className="stat-cards" style={{ gridTemplateColumns: "1fr 1fr", margin: "14px 0" }}>
              <div className="stat-card">
                <b>{detail.orders}</b>
                <span>Pedidos</span>
              </div>
              <div className="stat-card">
                <b>{fmt.format(detail.spent)}</b>
                <span>Gasto total</span>
              </div>
            </div>

            <h3 style={{ fontFamily: "var(--font-display)", margin: "16px 0 8px" }}>Notas internas</h3>
            {notes.length === 0 && (
              <p style={{ color: "var(--adm-muted)", fontSize: ".84rem" }}>Sin notas todavía.</p>
            )}
            {notes.map((n, i) => (
              <div key={i} style={{ borderBottom: "1px solid var(--adm-line)", padding: "8px 0", fontSize: ".85rem" }}>
                {n.text}
                <br />
                <small style={{ color: "var(--adm-muted)" }}>{n.fecha}</small>
              </div>
            ))}
            <form onSubmit={addNote} style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <input
                type="text"
                placeholder="Añadir nota interna…"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                style={{ flex: 1, border: "1.5px solid var(--adm-line)", borderRadius: 10, padding: "9px 12px", fontSize: ".85rem" }}
              />
              <button className="btn btn--primary btn--sm" type="submit">
                Guardar
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
