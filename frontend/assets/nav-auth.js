// assets/nav-auth.js
(function () {
  const SESSION_KEY = "scoutai_session_v1";

  function getSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); }
    catch { return null; }
  }
  function isLoggedIn() {
    const s = getSession();
    return !!(s && s.email);
  }
  function logout() {
    localStorage.removeItem(SESSION_KEY);
  }

  function renderAuthNav() {
    const host = document.getElementById("authNav");
    if (!host) return;

    host.innerHTML = "";

    if (isLoggedIn()) {
      const s = getSession();
      const a = document.createElement("a");
      a.href = "#";
      a.className = "btn";
      a.style.padding = "10px 12px";
      a.textContent = `Logout${s?.name ? ` (${s.name})` : ""}`;

      a.addEventListener("click", (e) => {
        e.preventDefault();
        logout();
        window.location.href = "index.html";
      });

      host.appendChild(a);
    } else {
      const a = document.createElement("a");
      a.href = "login.html";
      a.setAttribute("data-nav", "");
      a.textContent = "Login";
      host.appendChild(a);
    }
  }

  window.addEventListener("DOMContentLoaded", renderAuthNav);
})();