const SESSION_KEY = "scoutai_session_v1";

export function getSession(){
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); }
  catch { return null; }
}

export function isLoggedIn(){
  const s = getSession();
  return !!(s && s.email);
}

export function logout(){
  localStorage.removeItem(SESSION_KEY);
}