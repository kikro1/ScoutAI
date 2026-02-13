// assets/guard.js
(function () {
  const SESSION_KEY = "scoutai_session_v1";

  function getSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); }
    catch { return null; }
  }

  window.addEventListener("DOMContentLoaded", () => {
    const s = getSession();
    if (!s?.email) window.location.href = "login.html";
  });
})();