"use client";

import { useCallback, useEffect, useState } from "react";
import type { Category } from "@/lib/types";
import { get } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { Icon } from "@/components/Icon";

interface LocalCat extends Category {
  local?: boolean;
}

const LOCAL_KEY = "aao_categories_custom";

function loadLocalCats(): LocalCat[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
  } catch {
    return [];
  }
}

export default function CategoriesSection() {
  const { toast } = useToast();
  const [cats, setCats] = useState<LocalCat[] | null>(null);
  const [name, setName] = useState("");
  const [label, setLabel] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);

  const load = useCallback(async () => {
    try {
      const api = await get<Category[]>("/categories");
      const local = loadLocalCats().filter((l) => !api.some((a) => a.name === l.name));
      setCats([...api, ...local]);
    } catch {
      setCats(loadLocalCats());
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const catName = name.trim();
    const catLabel = label.trim() || catName;
    if (!catName) return;
    try {
      // Intenta crear en la API; si no hay endpoint, guarda en local
      await get("/admin/categories").catch(() => null);
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/admin/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(localStorage.getItem("aao_token")
            ? { Authorization: `Bearer ${localStorage.getItem("aao_token")}` }
            : {}),
        },
        body: JSON.stringify({ name: catName, label: catLabel }),
      }).then(async (r) => {
        if (!r.ok && r.status !== 404) throw new Error("Error del servidor");
        if (r.status === 404) {
          const local = loadLocalCats().filter((c) => c.name !== catName);
          local.push({ name: catName, label: catLabel, productCount: 0, local: true });
          localStorage.setItem(LOCAL_KEY, JSON.stringify(local));
          setOffline(true);
        }
      });
      toast("Categoría guardada");
      setName("");
      setLabel("");
      setEditing(null);
      load();
    } catch (e) {
      toast(e instanceof Error ? `Error: ${e.message}` : "No se pudo guardar");
    }
  };

  const remove = async (cat: LocalCat) => {
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
      const r = await fetch(`${base}/admin/categories/${encodeURIComponent(cat.name)}`, {
        method: "DELETE",
        headers: localStorage.getItem("aao_token")
          ? { Authorization: `Bearer ${localStorage.getItem("aao_token")}` }
          : {},
      });
      if (r.status === 404) {
        const local = loadLocalCats().filter((c) => c.name !== cat.name);
        localStorage.setItem(LOCAL_KEY, JSON.stringify(local));
        setOffline(true);
      } else if (!r.ok) {
        throw new Error("No se pudo eliminar");
      }
      toast("Categoría eliminada");
      load();
    } catch (e) {
      toast(e instanceof Error ? `Error: ${e.message}` : "No se pudo eliminar");
    }
  };

  if (cats === null) return <p className="grid__empty">Cargando categorías…</p>;

  return (
    <>
      <div className="acard" style={{ marginBottom: 16 }}>
        <h2>{editing ? `Editar categoría: ${editing}` : "Nueva categoría"}</h2>
        {offline && (
          <p className="notif-pill">
            <Icon name="bell" size={14} /> La API no expone CRUD de categorías: se guardan localmente.
          </p>
        )}
        <form className="admin-toolbar" onSubmit={save}>
          <input
            type="text"
            placeholder="Nombre interno (p. ej. Tech)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Etiqueta visible (p. ej. Tecnología)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <button className="btn btn--primary btn--sm" type="submit">
            {editing ? "Guardar cambios" : "Añadir categoría"}
          </button>
          {editing && (
            <button className="btn btn--outline btn--sm" type="button" onClick={() => { setEditing(null); setName(""); setLabel(""); }}>
              Cancelar
            </button>
          )}
        </form>
      </div>

      <div className="acard admin-table-wrap">
        <table className="ptable admin-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Etiqueta</th>
              <th>Productos</th>
              <th>Origen</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {cats.map((c) => (
              <tr key={c.name}>
                <td className="rowlink">{c.name}</td>
                <td>{c.label}</td>
                <td className="num">{c.productCount}</td>
                <td>{c.local ? <span className="status status--warn">Local</span> : <span className="status status--ok">API</span>}</td>
                <td>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      className="btn btn--outline btn--sm"
                      onClick={() => {
                        setEditing(c.name);
                        setName(c.name);
                        setLabel(c.label);
                      }}
                    >
                      Editar
                    </button>
                    <button className="btn btn--outline btn--sm" style={{ color: "#B91C1C" }} onClick={() => remove(c)}>
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
