"use client";

import { useCallback, useEffect, useState } from "react";
import { del, get, patch, post } from "@/lib/api";
import type { Role, User } from "@/lib/types";
import { useToast } from "@/context/ToastContext";
import { Icon } from "@/components/Icon";

interface AdminUser extends User {
  password?: string;
}

export default function UsersSection() {
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [noList, setNoList] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "admin" as Role, password: "" });

  const load = useCallback(() => {
    get<AdminUser[]>("/admin/users", { auth: true })
      .then((list) => setUsers(list))
      .catch((e) => {
        if (e?.status === 403) setForbidden(true);
        else {
          // El contrato no lista GET /admin/users: permitimos alta igualmente
          setNoList(true);
          setUsers([]);
        }
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await post("/admin/users", form, { auth: true });
      toast("Usuario creado");
      setForm({ name: "", email: "", role: "admin", password: "" });
      load();
    } catch (e2) {
      toast(e2 instanceof Error ? `Error: ${e2.message}` : "No se pudo crear el usuario");
    }
  };

  const changeRole = async (email: string, role: Role) => {
    try {
      await patch(`/admin/users/${encodeURIComponent(email)}/role`, { role }, { auth: true });
      toast("Rol actualizado");
      load();
    } catch (e) {
      toast(e instanceof Error ? `Error: ${e.message}` : "No se pudo cambiar el rol");
    }
  };

  const removeUser = async (email: string) => {
    try {
      await del(`/admin/users/${encodeURIComponent(email)}`, { auth: true });
      toast("Usuario eliminado");
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
        <p style={{ color: "var(--adm-muted)" }}>
          La gestión de usuarios requiere rol de superadministrador (la API responde 403 a otros roles).
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="acard" style={{ marginBottom: 16 }}>
        <h2>Alta de usuario del equipo</h2>
        <form className="admin-toolbar" onSubmit={create}>
          <input
            type="text"
            placeholder="Nombre"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            type="email"
            placeholder="Correo"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })} aria-label="Rol">
            <option value="admin">admin</option>
            <option value="superadmin">superadmin</option>
          </select>
          <input
            type="password"
            placeholder="Contraseña"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            minLength={6}
          />
          <button className="btn btn--primary btn--sm" type="submit">
            Crear usuario
          </button>
        </form>
      </div>

      <div className="acard admin-table-wrap">
        <h2>
          Usuarios del equipo <small>{users?.length ?? 0}</small>
        </h2>
        {noList && (
          <p className="notif-pill">
            <Icon name="bell" size={14} /> La API no expone el listado de usuarios (GET /admin/users); se muestra el alta igualmente.
          </p>
        )}
        {users === null ? (
          <p className="grid__empty">Cargando usuarios…</p>
        ) : users.length === 0 ? (
          <p className="grid__empty">{noList ? "Listado no disponible." : "No hay usuarios del equipo."}</p>
        ) : (
          <table className="ptable admin-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.email}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u.email, e.target.value as Role)}
                      aria-label={`Rol de ${u.name}`}
                    >
                      <option value="admin">admin</option>
                      <option value="superadmin">superadmin</option>
                    </select>
                  </td>
                  <td>
                    <button
                      className="btn btn--outline btn--sm"
                      style={{ color: "#B91C1C" }}
                      onClick={() => removeUser(u.email)}
                    >
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
