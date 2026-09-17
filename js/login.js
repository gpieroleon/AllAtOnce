/* ═══════════════════════════════════════════════════════════
   ALL AT ONCE — Flujo de acceso (login.html)
   Email → contraseña (referencia amazon.com) + registro.
   ═══════════════════════════════════════════════════════════ */

"use strict";

(function () {
  AAO_AUTH.seed();

  // URL de retorno: explícita (?from=) o el referrer del navegador
  const params = new URLSearchParams(location.search);
  const from = params.get("from");
  const isSafe = (u) => u && u.startsWith("/") === false && !u.startsWith("//") && !/^[a-z]+:/i.test(u);
  let returnUrl = "index.html";
  if (isSafe(from)) returnUrl = from;
  else if (document.referrer && document.referrer.startsWith(location.origin)) {
    const refPath = document.referrer.slice(location.origin.length);
    if (refPath) returnUrl = refPath;
  }

  // Ya con sesión: el staff va al panel; el cliente vuelve a donde estaba
  if (AAO_AUTH.session()) {
    window.location.href = AAO_AUTH.isAdmin() ? "admin.html" : AAO_LOGIN_withParam(returnUrl, "login=ok");
    return;
  }

  function AAO_LOGIN_withParam(url, kv) {
    const [path, hash] = url.split("#");
    const sep = path.includes("?") ? "&" : "?";
    return `${path}${sep}${kv}${hash ? "#" + hash : ""}`;
  }

  // Exponer para pruebas y para el botón Atrás
  window.AAO_LOGIN = {
    returnUrl,
    withParam: AAO_LOGIN_withParam,
    goBack() {
      if (window.history.length > 1 && document.referrer) window.history.back();
      else window.location.href = returnUrl;
    },
  };

  // Botón Atrás: vuelve exactamente a donde estaba el usuario
  document.getElementById("backBtn").addEventListener("click", () => window.AAO_LOGIN.goBack());

  const $ = (sel) => document.querySelector(sel);

  const steps = {
    email: $("#stepEmail"),
    pass: $("#stepPass"),
    register: $("#stepRegister"),
  };
  const alertBox = $("#authAlert");
  const alertMsg = $("#authMsg");
  let pendingEmail = null;

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function showAlert(msg, input) {
    alertMsg.textContent = msg;
    alertBox.hidden = false;
    if (input) {
      input.classList.add("is-error");
      input.focus();
    }
  }
  function clearAlert() {
    alertBox.hidden = true;
    $$inputs().forEach((i) => i.classList.remove("is-error"));
  }
  function $$inputs() {
    return [...document.querySelectorAll(".auth__input")];
  }

  function showStep(name) {
    Object.values(steps).forEach((s) => { s.hidden = true; });
    steps[name].hidden = false;
    clearAlert();
    const inRegister = name === "register";
    $("#authDivider").style.display = inRegister ? "none" : "";
    $("#createBtn").style.display = inRegister ? "none" : "";
    document.querySelector(".auth__card").scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  /* ── Paso 1: email ── */
  $("#emailForm").addEventListener("submit", (e) => {
    e.preventDefault();
    clearAlert();
    const email = $("#emailInput").value.trim();
    if (!EMAIL_RE.test(email)) {
      showAlert("Introduce un email válido.", $("#emailInput"));
      return;
    }
    if (!AAO_AUTH.find(email)) {
      showAlert("No encontramos una cuenta asociada a este email. Puedes crear una nueva abajo.", $("#emailInput"));
      return;
    }
    // Solo clientes: las cuentas de equipo entran por el panel admin
    const account = AAO_AUTH.find(email);
    if (AAO_AUTH.ADMIN_ROLES.includes(account.role)) {
      showAlert("Esta cuenta pertenece al equipo de All At Once. Accede desde el panel de administración (admin.html).", $("#emailInput"));
      return;
    }
    pendingEmail = email.toLowerCase();
    $("#passEmail").textContent = email;
    $("#passInput").value = "";
    showStep("pass");
    setTimeout(() => $("#passInput").focus(), 60);
  });

  /* ── Redirección tras login: el staff va SIEMPRE al panel admin ── */
  function redirectAfterLogin() {
    const dest = AAO_AUTH.isAdmin() ? "admin.html" : window.AAO_LOGIN.withParam(window.AAO_LOGIN.returnUrl, "login=ok");
    window.AAO_LOGIN.lastRedirect = dest;
    window.location.href = dest;
  }

  /* ── Paso 2: contraseña ── */
  $("#passForm").addEventListener("submit", (e) => {
    e.preventDefault();
    clearAlert();
    const res = AAO_AUTH.login(pendingEmail, $("#passInput").value);
    if (!res.ok) {
      showAlert(res.error, $("#passInput"));
      return;
    }
    redirectAfterLogin();
  });

  $("#changeEmail").addEventListener("click", () => {
    $("#emailInput").value = pendingEmail || "";
    showStep("email");
    setTimeout(() => $("#emailInput").focus(), 60);
  });

  $("#showPass").addEventListener("change", (e) => {
    $("#passInput").type = e.target.checked ? "text" : "password";
  });
  $("#showRegPass").addEventListener("change", (e) => {
    $("#regPass").type = e.target.checked ? "text" : "password";
  });

  /* ── Crear cuenta ── */
  $("#createBtn").addEventListener("click", () => {
    $("#regName").value = "";
    $("#regEmail").value = "";
    $("#regPass").value = "";
    showStep("register");
    setTimeout(() => $("#regName").focus(), 60);
  });
  $("#backLogin").addEventListener("click", () => showStep("email"));

  $("#registerForm").addEventListener("submit", (e) => {
    e.preventDefault();
    clearAlert();
    const name = $("#regName").value.trim();
    const email = $("#regEmail").value.trim();
    const pass = $("#regPass").value;

    if (name.length < 2) { showAlert("Introduce tu nombre.", $("#regName")); return; }
    if (!EMAIL_RE.test(email)) { showAlert("Introduce un email válido.", $("#regEmail")); return; }
    if (pass.length < 6) { showAlert("La contraseña debe tener al menos 6 caracteres.", $("#regPass")); return; }

    const res = AAO_AUTH.register(name, email, pass);
    if (!res.ok) { showAlert(res.error, $("#regEmail")); return; }

    AAO_AUTH.login(email, pass);
    window.location.href = window.AAO_LOGIN.withParam(window.AAO_LOGIN.returnUrl, "login=ok");
  });
})();
