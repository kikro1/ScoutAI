const USERS_KEY = "scoutai_users_v1";
const SESSION_KEY = "scoutai_session_v1";

function loadUsers(){
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || "[]"); }
  catch { return []; }
}
function saveUsers(users){
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function setSession(session){
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}
function getSession(){
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); }
  catch { return null; }
}
function clearSession(){
  localStorage.removeItem(SESSION_KEY);
}

function $(id){ return document.getElementById(id); }

function showMsg(text, isError=false){
  const el = $("authMsg");
  el.textContent = text;
  el.style.color = isError ? "var(--danger)" : "var(--muted)";
}

function setTab(isLogin){
  $("tabLogin").className = isLogin ? "btn primary" : "btn";
  $("tabSignup").className = isLogin ? "btn" : "btn primary";
  $("loginForm").style.display = isLogin ? "" : "none";
  $("signupForm").style.display = isLogin ? "none" : "";
  showMsg("");
}

function normalizeEmail(e){ return String(e || "").trim().toLowerCase(); }

// --- Login page logic ---
window.addEventListener("DOMContentLoaded", ()=>{
  // If already logged in -> go app
  const session = getSession();
  if (session?.email) {
    location.href = "app.html";
    return;
  }

  $("tabLogin").onclick = ()=> setTab(true);
  $("tabSignup").onclick = ()=> setTab(false);

  $("loginForm").addEventListener("submit", (ev)=>{
    ev.preventDefault();
    const email = normalizeEmail($("loginEmail").value);
    const pass = $("loginPass").value;

    const users = loadUsers();
    const u = users.find(x => x.email === email);
    if (!u || u.pass !== pass) {
      showMsg("Invalid email or password.", true);
      return;
    }
    setSession({ email: u.email, name: u.name, createdAt: u.createdAt });
    showMsg("Logged in. Redirecting…");
    setTimeout(()=> location.href="app.html", 400);
  });

  $("signupForm").addEventListener("submit", (ev)=>{
    ev.preventDefault();
    const name = $("signupName").value.trim();
    const email = normalizeEmail($("signupEmail").value);
    const pass = $("signupPass").value;
    const pass2 = $("signupPass2").value;

    if (pass !== pass2) {
      showMsg("Passwords do not match.", true);
      return;
    }
    if (pass.length < 6) {
      showMsg("Password must be at least 6 characters.", true);
      return;
    }

    const users = loadUsers();
    if (users.some(x => x.email === email)) {
      showMsg("An account with this email already exists.", true);
      return;
    }

    users.push({ name, email, pass, createdAt: new Date().toISOString() });
    saveUsers(users);

    setSession({ email, name, createdAt: new Date().toISOString() });
    showMsg("Account created. Redirecting…");
    setTimeout(()=> location.href="app.html", 400);
  });

  setTab(true);
});