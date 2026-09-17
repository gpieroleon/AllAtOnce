"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Category, Product, Variant } from "@/lib/types";
import { del, get, patch, post } from "@/lib/api";
import { discount, fmt, slugify } from "@/lib/format";
import { useToast } from "@/context/ToastContext";
import { Icon, Stars } from "@/components/Icon";

// ── Carga del catálogo completo (admin): intenta /admin/products,
//    si no existe cae al listado público ─────────────────────────
export async function loadAdminProducts(): Promise<Product[]> {
  try {
    return await get<Product[]>("/admin/products", { auth: true });
  } catch {
    return get<Product[]>("/products?cat=all");
  }
}

interface FormState {
  name: string;
  slug: string;
  sku: string;
  descCorta: string;
  descLarga: string;
  cats: string[];
  etiquetas: string;
  price: string;
  old: string;
  costo: string;
  stock: string;
  peso: string;
  estado: "publicado" | "borrador" | "agotado";
  deal: boolean;
  prime: boolean;
  badge: "" | "flash" | "new" | "top";
  variantes: Variant[];
  imagenes: string[];
  specs: { k: string; v: string }[];
  feats: string;
  metaTitulo: string;
  metaDescripcion: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  slug: "",
  sku: "",
  descCorta: "",
  descLarga: "",
  cats: [],
  etiquetas: "",
  price: "",
  old: "",
  costo: "",
  stock: "10",
  peso: "",
  estado: "publicado",
  deal: false,
  prime: false,
  badge: "",
  variantes: [],
  imagenes: [],
  specs: [],
  feats: "",
  metaTitulo: "",
  metaDescripcion: "",
};

function toForm(p: Product): FormState {
  return {
    name: p.name,
    slug: p.slug,
    sku: p.sku ?? "",
    descCorta: p.descCorta ?? "",
    descLarga: p.descLarga ?? "",
    cats: p.cats?.length ? p.cats : [p.cat],
    etiquetas: (p.etiquetas ?? []).join(", "),
    price: String(p.price),
    old: p.old ? String(p.old) : "",
    costo: p.costo != null ? String(p.costo) : "",
    stock: String(p.stock),
    peso: p.peso != null ? String(p.peso) : "",
    estado: p.estado,
    deal: p.deal,
    prime: p.prime,
    badge: p.badge ?? "",
    variantes: p.variantes ?? [],
    imagenes: p.imagenes ?? [],
    specs: Object.entries(p.specs ?? {}).map(([k, v]) => ({ k, v })),
    feats: (p.feats ?? []).join("\n"),
    metaTitulo: p.metaTitulo ?? "",
    metaDescripcion: p.metaDescripcion ?? "",
  };
}

function toPayload(f: FormState) {
  const price = parseFloat(f.price) || 0;
  const old = parseFloat(f.old) || price;
  return {
    name: f.name.trim(),
    slug: f.slug.trim() || slugify(f.name),
    sku: f.sku.trim() || undefined,
    descCorta: f.descCorta.trim() || undefined,
    descLarga: f.descLarga.trim() || undefined,
    cat: f.cats[0] || "Accesorios",
    cats: f.cats,
    etiquetas: f.etiquetas.split(",").map((t) => t.trim()).filter(Boolean),
    price,
    old: old >= price ? old : price,
    costo: f.costo ? parseFloat(f.costo) : undefined,
    stock: parseInt(f.stock, 10) || 0,
    peso: f.peso ? parseFloat(f.peso) : undefined,
    estado: f.estado,
    deal: f.deal,
    prime: f.prime,
    badge: f.badge || null,
    variantes: f.variantes,
    imagenes: f.imagenes.filter(Boolean),
    specs: Object.fromEntries(f.specs.filter((s) => s.k.trim()).map((s) => [s.k.trim(), s.v])),
    feats: f.feats.split("\n").map((x) => x.trim()).filter(Boolean),
    metaTitulo: f.metaTitulo.trim() || undefined,
    metaDescripcion: f.metaDescripcion.trim() || undefined,
  };
}

function ProductForm({
  initial,
  categories,
  onSaved,
  onCancel,
}: {
  initial: Product | null;
  categories: Category[];
  onSaved: () => void;
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const [f, setF] = useState<FormState>(initial ? toForm(initial) : EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((prev) => ({ ...prev, [k]: v }));

  const toggleCat = (name: string) =>
    set("cats", f.cats.includes(name) ? f.cats.filter((c) => c !== name) : [...f.cats, name]);

  const moveImg = (i: number, dir: -1 | 1) => {
    const imgs = [...f.imagenes];
    const j = i + dir;
    if (j < 0 || j >= imgs.length) return;
    [imgs[i], imgs[j]] = [imgs[j], imgs[i]];
    set("imagenes", imgs);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!f.name.trim()) {
      setErr("El nombre es obligatorio.");
      return;
    }
    if (!parseFloat(f.price)) {
      setErr("El precio debe ser mayor que cero.");
      return;
    }
    setSaving(true);
    try {
      const payload = toPayload(f);
      if (initial) {
        await patch(`/products/${initial.id}`, payload, { auth: true });
        toast("Producto actualizado");
      } else {
        await post("/products", payload, { auth: true });
        toast("Producto creado");
      }
      onSaved();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save}>
      {err && <p className="form-alert is-show">{err}</p>}

      <div className="form-grid">
        <div className="field field--full">
          <label htmlFor="p_name">Nombre del producto *</label>
          <input
            id="p_name"
            value={f.name}
            onChange={(e) => setF((prev) => ({ ...prev, name: e.target.value, slug: prev.slug && !initial ? slugify(e.target.value) : prev.slug }))}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="p_slug">Slug (auto)</label>
          <input id="p_slug" value={f.slug} onChange={(e) => set("slug", slugify(e.target.value))} placeholder={slugify(f.name) || "slug-del-producto"} />
        </div>
        <div className="field">
          <label htmlFor="p_sku">SKU</label>
          <input id="p_sku" value={f.sku} onChange={(e) => set("sku", e.target.value)} />
        </div>
        <div className="field field--full">
          <label htmlFor="p_descCorta">Descripción corta</label>
          <input id="p_descCorta" value={f.descCorta} onChange={(e) => set("descCorta", e.target.value)} />
        </div>
        <div className="field field--full">
          <label htmlFor="p_descLarga">Descripción larga</label>
          <textarea id="p_descLarga" value={f.descLarga} onChange={(e) => set("descLarga", e.target.value)} />
        </div>

        <div className="field field--full">
          <label>Categorías (una o varias)</label>
          <div className="chipchecks">
            {categories.map((c) => (
              <label className="chipcheck" key={c.name}>
                <input type="checkbox" checked={f.cats.includes(c.name)} onChange={() => toggleCat(c.name)} />
                {c.label}
              </label>
            ))}
          </div>
        </div>

        <div className="field">
          <label htmlFor="p_etiquetas">Etiquetas (separadas por comas)</label>
          <input id="p_etiquetas" value={f.etiquetas} onChange={(e) => set("etiquetas", e.target.value)} placeholder="oferta, verano, nuevo" />
        </div>
        <div className="field">
          <label htmlFor="p_badge">Insignia</label>
          <select id="p_badge" value={f.badge} onChange={(e) => set("badge", e.target.value as FormState["badge"])}>
            <option value="">Ninguna</option>
            <option value="flash">Flash</option>
            <option value="new">Nuevo</option>
            <option value="top">Top ventas</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="p_price">Precio (€) *</label>
          <input id="p_price" type="number" step="0.01" min="0" value={f.price} onChange={(e) => set("price", e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="p_old">Precio anterior (€)</label>
          <input id="p_old" type="number" step="0.01" min="0" value={f.old} onChange={(e) => set("old", e.target.value)} />
          {parseFloat(f.old) > parseFloat(f.price) && (
            <span style={{ fontSize: ".74rem", color: "var(--green)" }}>
              -{Math.round((1 - parseFloat(f.price) / parseFloat(f.old)) * 100)}% de descuento
            </span>
          )}
        </div>
        <div className="field">
          <label htmlFor="p_costo">Coste (€)</label>
          <input id="p_costo" type="number" step="0.01" min="0" value={f.costo} onChange={(e) => set("costo", e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="p_stock">Stock</label>
          <input id="p_stock" type="number" min="0" value={f.stock} onChange={(e) => set("stock", e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="p_peso">Peso (kg)</label>
          <input id="p_peso" type="number" step="0.01" min="0" value={f.peso} onChange={(e) => set("peso", e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="p_estado">Estado</label>
          <select id="p_estado" value={f.estado} onChange={(e) => set("estado", e.target.value as FormState["estado"])}>
            <option value="publicado">Publicado</option>
            <option value="borrador">Borrador</option>
            <option value="agotado">Agotado</option>
          </select>
        </div>

        <div className="field">
          <label>Toggles</label>
          <div style={{ display: "flex", gap: 16, paddingTop: 6 }}>
            <label className="chipcheck">
              <input type="checkbox" checked={f.deal} onChange={(e) => set("deal", e.target.checked)} />
              Oferta flash
            </label>
            <label className="chipcheck">
              <input type="checkbox" checked={f.prime} onChange={(e) => set("prime", e.target.checked)} />
              Envío exprés
            </label>
          </div>
        </div>

        <div className="field field--full">
          <label>Variantes (talla · color · stock)</label>
          {f.variantes.map((v, i) => (
            <div className="vrow" key={i}>
              <input
                className="v-talla"
                placeholder="Talla"
                value={v.talla ?? ""}
                onChange={(e) =>
                  set("variantes", f.variantes.map((x, j) => (j === i ? { ...x, talla: e.target.value } : x)))
                }
              />
              <input
                className="v-color"
                placeholder="Color (nombre o #hex)"
                value={v.color ?? ""}
                onChange={(e) =>
                  set("variantes", f.variantes.map((x, j) => (j === i ? { ...x, color: e.target.value } : x)))
                }
              />
              <input
                className="v-stock"
                type="number"
                min="0"
                placeholder="Stock"
                value={v.stock}
                onChange={(e) =>
                  set("variantes", f.variantes.map((x, j) => (j === i ? { ...x, stock: parseInt(e.target.value, 10) || 0 } : x)))
                }
              />
              <button
                type="button"
                className="v-del"
                onClick={() => set("variantes", f.variantes.filter((_, j) => j !== i))}
                aria-label="Eliminar variante"
              >
                <Icon name="trash" size={16} />
              </button>
            </div>
          ))}
          <button type="button" className="btn btn--outline btn--sm" onClick={() => set("variantes", [...f.variantes, { talla: "", color: "", stock: 0 }])}>
            + Añadir variante
          </button>
        </div>

        <div className="field field--full">
          <label>Imágenes (la primera es la principal)</label>
          {f.imagenes.map((img, i) => (
            <div className="irow" key={i}>
              <span className="irow__idx">{i + 1}</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="irow__thumb" src={img} alt="" onError={(e) => ((e.target as HTMLImageElement).style.visibility = "hidden")} />
              <input
                className="i-url"
                placeholder="https://…"
                value={img}
                onChange={(e) => set("imagenes", f.imagenes.map((x, j) => (j === i ? e.target.value : x)))}
              />
              <button type="button" onClick={() => moveImg(i, -1)} disabled={i === 0} aria-label="Subir">
                ↑
              </button>
              <button type="button" onClick={() => moveImg(i, 1)} disabled={i === f.imagenes.length - 1} aria-label="Bajar">
                ↓
              </button>
              <button
                type="button"
                className="i-del"
                onClick={() => set("imagenes", f.imagenes.filter((_, j) => j !== i))}
                aria-label="Eliminar imagen"
              >
                <Icon name="trash" size={16} />
              </button>
            </div>
          ))}
          <button type="button" className="btn btn--outline btn--sm" onClick={() => set("imagenes", [...f.imagenes, ""])}>
            + Añadir imagen
          </button>
        </div>

        <div className="field field--full">
          <label>Ficha técnica (especificaciones)</label>
          {f.specs.map((s, i) => (
            <div className="vrow" key={i}>
              <input
                className="v-talla"
                style={{ width: 200 }}
                placeholder="Campo"
                value={s.k}
                onChange={(e) => set("specs", f.specs.map((x, j) => (j === i ? { ...x, k: e.target.value } : x)))}
              />
              <input
                className="v-color"
                placeholder="Valor"
                value={s.v}
                onChange={(e) => set("specs", f.specs.map((x, j) => (j === i ? { ...x, v: e.target.value } : x)))}
              />
              <button type="button" className="v-del" onClick={() => set("specs", f.specs.filter((_, j) => j !== i))} aria-label="Eliminar especificación">
                <Icon name="trash" size={16} />
              </button>
            </div>
          ))}
          <button type="button" className="btn btn--outline btn--sm" onClick={() => set("specs", [...f.specs, { k: "", v: "" }])}>
            + Añadir especificación
          </button>
        </div>

        <div className="field field--full">
          <label htmlFor="p_feats">Características (una por línea)</label>
          <textarea id="p_feats" value={f.feats} onChange={(e) => set("feats", e.target.value)} style={{ minHeight: 90 }} />
        </div>

        <div className="field">
          <label htmlFor="p_metaT">SEO · Título</label>
          <input id="p_metaT" value={f.metaTitulo} onChange={(e) => set("metaTitulo", e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="p_metaD">SEO · Descripción</label>
          <input id="p_metaD" value={f.metaDescripcion} onChange={(e) => set("metaDescripcion", e.target.value)} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
        <button className="btn btn--primary" type="submit" disabled={saving}>
          {saving ? "Guardando…" : initial ? "Guardar cambios" : "Crear producto"}
        </button>
        <button className="btn btn--outline" type="button" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

export default function ProductsSection({ isSuper }: { isSuper: boolean }) {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [q, setQ] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [editing, setEditing] = useState<Product | "new" | null>(null);
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
    get<Category[]>("/categories").then(setCategories).catch(() => setCategories([]));
  }, [load]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (products ?? []).filter(
      (p) =>
        (!needle || p.name.toLowerCase().includes(needle) || (p.sku ?? "").toLowerCase().includes(needle)) &&
        (!estadoFilter || p.estado === estadoFilter)
    );
  }, [products, q, estadoFilter]);

  const allSelected = filtered.length > 0 && filtered.every((p) => selected.has(p.id));

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(filtered.map((p) => p.id)));
  };

  const toggleOne = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const bulk = async (action: "publicado" | "borrador" | "deal" | "delete") => {
    const ids = [...selected];
    if (ids.length === 0) return;
    try {
      if (action === "delete") {
        await Promise.all(ids.map((id) => del(`/products/${id}`, { auth: true })));
        toast(`${ids.length} producto(s) eliminados`);
      } else {
        const patchData =
          action === "deal" ? { deal: true } : { estado: action };
        await patch("/products/bulk", { ids, patch: patchData }, { auth: true });
        toast(
          action === "deal"
            ? "Añadidos a ofertas flash"
            : action === "publicado"
              ? "Productos publicados"
              : "Enviados a borrador"
        );
      }
      setSelected(new Set());
      load();
    } catch (e) {
      toast(e instanceof Error ? `Error: ${e.message}` : "No se pudo completar");
    }
  };

  if (forbidden) {
    return (
      <div className="acard" style={{ textAlign: "center", padding: 48 }}>
        <Icon name="shield" size={40} className="pd__fallback" />
        <h2 style={{ fontFamily: "var(--font-display)", marginTop: 10 }}>Sin permiso</h2>
        <p style={{ color: "var(--adm-muted)" }}>Tu rol no puede gestionar el catálogo.</p>
      </div>
    );
  }

  if (editing !== null) {
    return (
      <div className="acard">
        <h2>{editing === "new" ? "Nuevo producto" : `Editar: ${editing.name}`}</h2>
        <ProductForm
          initial={editing === "new" ? null : editing}
          categories={categories}
          onSaved={() => {
            setEditing(null);
            load();
          }}
          onCancel={() => setEditing(null)}
        />
      </div>
    );
  }

  return (
    <>
      <div className="admin-toolbar">
        <input type="search" placeholder="Buscar por nombre o SKU…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)} aria-label="Filtrar por estado">
          <option value="">Todos los estados</option>
          <option value="publicado">Publicado</option>
          <option value="borrador">Borrador</option>
          <option value="agotado">Agotado</option>
        </select>
        <span className="spacer" />
        <button className="btn btn--primary btn--sm" onClick={() => setEditing("new")}>
          <Icon name="plus" size={16} /> Nuevo producto
        </button>
      </div>

      {selected.size > 0 && (
        <div className="bulk-bar is-show">
          <span>{selected.size} seleccionado{selected.size > 1 ? "s" : ""}</span>
          <button onClick={() => bulk("publicado")}>Publicar</button>
          <button onClick={() => bulk("borrador")}>Borrador</button>
          <button onClick={() => bulk("deal")}>Ofertas</button>
          <button onClick={() => bulk("delete")} style={{ background: "#DC2626" }}>
            Eliminar
          </button>
          <button onClick={() => setSelected(new Set())}>Cancelar</button>
        </div>
      )}

      <div className="acard admin-table-wrap">
        {products === null ? (
          <p className="grid__empty">Cargando productos…</p>
        ) : (
          <table className="ptable admin-table">
            <thead>
              <tr>
                <th>
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Seleccionar todos" />
                </th>
                <th>Producto</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Estado</th>
                <th>Oferta</th>
                <th>Valoración</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td>
                    <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleOne(p.id)} aria-label={`Seleccionar ${p.name}`} />
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span className="ptable__img" style={{ background: "linear-gradient(140deg,#FF6A00,#FF3D1F)" }}>
                        {p.img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.img} alt="" />
                        ) : (
                          <Icon name="box" />
                        )}
                      </span>
                      <span>
                        <span className="rowlink">{p.name}</span>
                        <br />
                        <small style={{ color: "var(--adm-muted)" }}>
                          {p.cat} {p.sku && `· ${p.sku}`}
                        </small>
                      </span>
                    </div>
                  </td>
                  <td className="num">
                    {fmt.format(p.price)}
                    {p.old > p.price && (
                      <>
                        {" "}
                        <s style={{ color: "var(--adm-muted)", fontSize: ".78rem" }}>{fmt.format(p.old)}</s>
                        <span className="pill pill--off" style={{ marginLeft: 6 }}>
                          -{discount(p)}%
                        </span>
                      </>
                    )}
                  </td>
                  <td className="num">{p.stock}</td>
                  <td>
                    <span className={`status ${p.estado === "publicado" ? "status--ok" : p.estado === "agotado" ? "status--warn" : ""}`}>
                      {p.estado}
                    </span>
                  </td>
                  <td>{p.deal ? <span className="status status--info">Flash</span> : "—"}</td>
                  <td>
                    <Stars rating={p.rating} />
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <Link className="btn btn--outline btn--sm" href={`/producto/${p.id}`} target="_blank">
                        Ver
                      </Link>
                      <button className="btn btn--primary btn--sm" onClick={() => setEditing(p)}>
                        Editar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {!isSuper && <p className="summary-note" style={{ marginTop: 10 }}>Algunas acciones pueden requerir permisos de superadministrador.</p>}
    </>
  );
}
