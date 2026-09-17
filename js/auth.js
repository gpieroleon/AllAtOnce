/* ═══════════════════════════════════════════════════════════
   ALL AT ONCE — Autenticación, roles y datos de cuenta
   Roles admin (especificación 3.5):
     · superadmin → acceso total, incluida configuración y usuarios
     · editor     → solo productos, categorías e inventario
     · soporte    → solo pedidos y clientes
   Demo cliente: demo@allatonce.com / AllAtOnce#2026
   Staff: admin@allatonce.com/Admin2026! · editor@allatonce.com/Editor2026!
          soporte@allatonce.com/Soporte2026!
   ═══════════════════════════════════════════════════════════ */

"use strict";

const AAO_AUTH = (() => {
  const USERS_KEY = "aao_users";
  const SESSION_KEY = "aao_session";
  const ADDR_KEY = "aao_addresses";
  const ORDERS_KEY = "aao_orders";
  const NOTES_KEY = "aao_client_notes";
  const NOTIF_KEY = "aao_notifications";

  const DEMO = { name: "Demo", email: "demo@allatonce.com", pass: "AllAtOnce#2026", role: "cliente", reg: "2026-01-15T10:00:00.000Z" };
  const STAFF = [
    { name: "Superadmin", email: "admin@allatonce.com", pass: "Admin2026!", role: "superadmin", reg: "2026-01-10T09:00:00.000Z" },
    { name: "Equipo AAO", email: "equipo@allatonce.com", pass: "Equipo2026!", role: "admin", reg: "2026-01-12T09:00:00.000Z" },
  ];
  const ADMIN_ROLES = ["superadmin", "admin"];

  /* Permisos por rol:
     · superadmin → acceso total, incluida configuración y usuarios
     · admin      → catálogo, inventario, pedidos, clientes, cupones y reseñas */
  const PERMS = {
    superadmin: ["dashboard", "pedidos", "productos", "categorias", "inventario", "clientes", "cupones", "resenas", "reportes", "envios", "pagos", "configuracion", "usuarios"],
    admin: ["dashboard", "pedidos", "productos", "categorias", "inventario", "clientes", "cupones", "resenas"],
  };

  const read = (key) => JSON.parse(localStorage.getItem(key) || "null");
  const write = (key, val) => localStorage.setItem(key, JSON.stringify(val));

  function seed() {
    const users = read(USERS_KEY) || {};
    [DEMO, ...STAFF].forEach((u) => {
      if (!users[u.email]) users[u.email] = { name: u.name, pass: btoa(u.pass), role: u.role, phone: "", reg: u.reg };
    });
    // Migración de roles: "admin"/"editor"/"soporte" antiguos → "superadmin"/"admin"
    Object.entries(users).forEach(([email, u]) => {
      if (u.role === "admin") u.role = email === "admin@allatonce.com" ? "superadmin" : "admin";
      if (u.role === "editor" || u.role === "soporte") u.role = "admin";
    });
    Object.entries(users).forEach(([email, u]) => { if (!u.reg) u.reg = new Date().toISOString(); });
    write(USERS_KEY, users);
  }

  const users = () => read(USERS_KEY) || {};
  const find = (email) => users()[(email || "").toLowerCase().trim()];
  const session = () => read(SESSION_KEY);
  const role = () => { const s = session(); return s ? s.role || "cliente" : null; };
  const isAdmin = () => ADMIN_ROLES.includes(role());
  const can = (perm) => { const r = role(); return !!r && (PERMS[r] || []).includes(perm); };
  const permsFor = (r) => PERMS[r] || [];

  function register(name, email, pass) {
    const all = users();
    email = email.toLowerCase().trim();
    if (all[email]) return { ok: false, error: "Ya existe una cuenta con este email." };
    all[email] = { name: name.trim(), pass: btoa(pass), role: "cliente", phone: "", reg: new Date().toISOString() };
    write(USERS_KEY, all);
    return { ok: true };
  }

  function login(email, pass) {
    const user = find(email);
    if (!user) return { ok: false, error: "No encontramos una cuenta asociada a este email." };
    if (user.pass !== btoa(pass)) return { ok: false, error: "Tu contraseña es incorrecta. Vuelve a intentarlo." };
    write(SESSION_KEY, { email: (email || "").toLowerCase().trim(), name: user.name, role: user.role || "cliente" });
    return { ok: true };
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
  }

  /* ── Gestión de usuarios (admin/usuarios) ── */
  function createUser({ name, email, role: r, pass }) {
    const all = users();
    email = (email || "").toLowerCase().trim();
    if (!email || !name || !pass) return { ok: false, error: "Completa todos los campos." };
    if (!["cliente", ...ADMIN_ROLES].includes(r)) return { ok: false, error: "Rol no válido (usa admin o superadmin)." };
    if (all[email]) return { ok: false, error: "Ya existe una cuenta con este email." };
    all[email] = { name: name.trim(), pass: btoa(pass), role: r, phone: "", reg: new Date().toISOString() };
    write(USERS_KEY, all);
    return { ok: true };
  }

  function setRole(email, r) {
    const all = users();
    if (!all[email]) return { ok: false, error: "Usuario no encontrado." };
    if (!["cliente", ...ADMIN_ROLES].includes(r)) return { ok: false, error: "Rol no válido (usa admin o superadmin)." };
    // Nunca dejar la tienda sin superadmin (propio o de otro usuario)
    if (all[email].role === "superadmin" && r !== "superadmin") {
      const supers = Object.values(all).filter((u) => u.role === "superadmin").length;
      if (supers <= 1) return { ok: false, error: "Debe existir al menos un superadmin." };
    }
    all[email].role = r;
    write(USERS_KEY, all);
    return { ok: true };
  }

  function deleteUser(email) {
    const all = users();
    const s = session();
    if (!all[email]) return { ok: false, error: "Usuario no encontrado." };
    if (s && s.email === email) return { ok: false, error: "No puedes eliminar tu propia cuenta." };
    if (all[email].role === "superadmin") {
      const supers = Object.entries(all).filter(([, u]) => u.role === "superadmin").length;
      if (supers <= 1) return { ok: false, error: "Debe existir al menos un superadmin." };
    }
    delete all[email];
    write(USERS_KEY, all);
    return { ok: true };
  }

  /* ── Perfil ── */
  function updateProfile(email, { name, phone }) {
    const all = users();
    if (!all[email]) return { ok: false };
    all[email].name = name.trim();
    all[email].phone = (phone || "").trim();
    write(USERS_KEY, all);
    const s = session();
    if (s && s.email === email) write(SESSION_KEY, { ...s, name: all[email].name });
    return { ok: true };
  }

  function changePassword(email, oldPass, newPass) {
    const all = users();
    if (!all[email]) return { ok: false, error: "Cuenta no encontrada." };
    if (all[email].pass !== btoa(oldPass)) return { ok: false, error: "La contraseña actual no es correcta." };
    if (newPass.length < 6) return { ok: false, error: "La nueva contraseña debe tener al menos 6 caracteres." };
    all[email].pass = btoa(newPass);
    write(USERS_KEY, all);
    return { ok: true };
  }

  function resetPassword(email, newPass) {
    const all = users();
    if (!all[email]) return { ok: false };
    all[email].pass = btoa(newPass);
    write(USERS_KEY, all);
    return { ok: true };
  }

  /* ── Direcciones ── */
  function getAddresses(email) {
    const all = read(ADDR_KEY) || {};
    return all[email] || [];
  }
  function saveAddress(email, addr) {
    const all = read(ADDR_KEY) || {};
    const list = all[email] || [];
    if (addr.index != null && list[addr.index]) list[addr.index] = { ...addr, index: undefined };
    else list.push({ ...addr, index: undefined });
    all[email] = list;
    write(ADDR_KEY, all);
    return { ok: true };
  }
  function deleteAddress(email, index) {
    const all = read(ADDR_KEY) || {};
    const list = all[email] || [];
    list.splice(index, 1);
    all[email] = list;
    write(ADDR_KEY, all);
  }

  /* ── Pedidos ── */
  function getOrders(email = null) {
    const orders = read(ORDERS_KEY) || [];
    return email ? orders.filter((o) => o.cliente === email) : orders;
  }
  function getOrder(id) {
    return (read(ORDERS_KEY) || []).find((o) => o.id === id);
  }
  function placeOrder(order) {
    const orders = read(ORDERS_KEY) || [];
    orders.unshift(order);
    write(ORDERS_KEY, orders);
    return order;
  }
  function updateOrder(id, patch) {
    const orders = read(ORDERS_KEY) || [];
    const o = orders.find((x) => x.id === id);
    if (o) { Object.assign(o, patch); write(ORDERS_KEY, orders); }
    return o;
  }
  function updateOrderState(id, estado) {
    return updateOrder(id, { estado });
  }

  /* ── Notas internas de clientes ── */
  function getNotes(email) {
    const all = read(NOTES_KEY) || {};
    return all[email] || [];
  }
  function addNote(email, text) {
    const all = read(NOTES_KEY) || {};
    const list = all[email] || [];
    list.unshift({ text, fecha: new Date().toISOString() });
    all[email] = list;
    write(NOTES_KEY, all);
  }

  /* ── Notificaciones (email simulado) ── */
  function notify(email, mensaje) {
    const all = read(NOTIF_KEY) || [];
    all.unshift({ to: email, mensaje, fecha: new Date().toISOString() });
    write(NOTIF_KEY, all);
  }
  function getNotifications() { return read(NOTIF_KEY) || []; }

  /* ── Header de la tienda ── */
  function renderHeaderAuth() {
    const link = document.getElementById("authLink");
    if (!link) return;
    const label = document.getElementById("authLabel");
    const menu = document.getElementById("authMenu");
    const s = session();
    const from = encodeURIComponent(location.pathname.split("/").pop() + location.search + location.hash);

    if (s) {
      label.textContent = s.role === "cliente" ? `Hola, ${s.name}` : s.name;
      link.setAttribute("href", "#");
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const open = menu.hidden;
        menu.hidden = !open;
      });
      document.getElementById("authName").textContent = s.name;
      document.addEventListener("click", (e) => {
        if (!menu.hidden && !e.target.closest(".auth-wrap")) menu.hidden = true;
      });
      const bind = (id, href) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener("click", () => { window.location.href = href; });
      };
      bind("accountBtn", isAdmin() ? "admin.html" : "cuenta.html");
      bind("ordersBtn", isAdmin() ? "admin.html#pedidos" : "cuenta.html#pedidos");
      bind("favBtn", "favoritos.html");
      document.getElementById("logoutBtn").addEventListener("click", () => {
        logout();
        window.location.href = "index.html";
      });
    } else {
      label.textContent = "Iniciar sesión";
      link.href = `login.html?from=${from}`;
    }

    const params = new URLSearchParams(location.search);
    if (params.get("login") === "ok" && session() && typeof aaoToast === "function") {
      aaoToast(`Sesión iniciada — ¡Hola, ${session().name}!`);
      history.replaceState(null, "", location.pathname + location.hash);
    }
  }

  return {
    DEMO, STAFF, ADMIN_ROLES, PERMS,
    seed, users, find, register, login, logout, session,
    role, isAdmin, can, permsFor,
    createUser, setRole, deleteUser,
    updateProfile, changePassword, resetPassword,
    getAddresses, saveAddress, deleteAddress,
    getOrders, getOrder, placeOrder, updateOrder, updateOrderState,
    getNotes, addNote,
    notify, getNotifications,
    renderHeaderAuth,
  };
})();

window.AAO_AUTH = AAO_AUTH;
