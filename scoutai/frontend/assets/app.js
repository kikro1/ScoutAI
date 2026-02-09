// ======= CONFIG =======
// Вставишь сюда URL твоего Render backend после деплоя

const API_BASE = "https://scoutai-p6y7.onrender.com";

const LS_KEY = "scoutai_state_v1";

function nowISO(){ return new Date().toISOString(); }

function loadState(){
  const raw = localStorage.getItem(LS_KEY);
  if(!raw){
    const init = {
      folders: [
        { id: "f-default", name: "General", createdAt: nowISO() }
      ],
      chats: [
        { id: "c-welcome", folderId: "f-default", title: "Welcome", createdAt: nowISO(), messages: [
          { role:"ai", content:"Hey! I’m ScoutAI. Ask me a research question and choose a level (School / University / Expert). I can also work with text from a PDF if you paste it here." }
        ]}
      ],
      activeChatId: "c-welcome"
    };
    localStorage.setItem(LS_KEY, JSON.stringify(init));
    return init;
  }
  try { return JSON.parse(raw); } catch { return null; }
}

function saveState(state){
  localStorage.setItem(LS_KEY, JSON.stringify(state));
}

function $(sel){ return document.querySelector(sel); }
function escapeHtml(s){
  return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

function renderSidebar(state){
  const list = $("#chatList");
  list.innerHTML = "";
  const chats = state.chats.slice().sort((a,b)=> (b.createdAt||"").localeCompare(a.createdAt||""));

  chats.forEach(chat=>{
    const div = document.createElement("div");
    div.className = "item";
    div.dataset.id = chat.id;
    div.innerHTML = `
      <div class="title">${escapeHtml(chat.title || "Untitled")}</div>
      <div class="meta">${(chat.messages?.length||0)} messages</div>
    `;
    div.onclick = ()=>{
      state.activeChatId = chat.id;
      saveState(state);
      renderAll(state);
    };
    list.appendChild(div);
  });

  // KPI
  $("#kpiChats").textContent = String(state.chats.length);
  const totalMsgs = state.chats.reduce((sum,c)=> sum + (c.messages?.length||0), 0);
  $("#kpiMsgs").textContent = String(totalMsgs);
}

function renderChat(state){
  const chat = state.chats.find(c=>c.id===state.activeChatId) || state.chats[0];
  const box = $("#chatBox");
  box.innerHTML = "";

  chat.messages.forEach(m=>{
    const div = document.createElement("div");
    div.className = "msg " + (m.role==="user" ? "user" : "ai");
    div.textContent = m.content;
    box.appendChild(div);
  });

  // scroll bottom
  box.scrollTop = box.scrollHeight;
  $("#chatTitle").textContent = chat.title || "Chat";
}

function newChat(state){
  const id = "c-" + Math.random().toString(16).slice(2);
  const chat = {
    id,
    folderId: state.folders[0]?.id || "f-default",
    title: "New chat",
    createdAt: nowISO(),
    messages: [{ role:"ai", content:"Send a question and I’ll research it with sources-style reasoning (where possible)."}]
  };
  state.chats.unshift(chat);
  state.activeChatId = id;
  saveState(state);
  renderAll(state);
}

function deleteChat(state){
  if(state.chats.length<=1){
    alert("You need at least one chat.");
    return;
  }
  const idx = state.chats.findIndex(c=>c.id===state.activeChatId);
  if(idx>=0){
    state.chats.splice(idx,1);
    state.activeChatId = state.chats[0].id;
    saveState(state);
    renderAll(state);
  }
}

async function callAI({ message, level }){
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type":"application/json" },
    body: JSON.stringify({ message, level })
  });
  if(!res.ok){
    const text = await res.text().catch(()=> "");
    throw new Error(`API error ${res.status}: ${text || "Unknown error"}`);
  }
  return await res.json();
}

function setBusy(isBusy){
  $("#sendBtn").disabled = isBusy;
  $("#sendBtn").textContent = isBusy ? "Thinking…" : "Send";
}

async function onSend(state){
  const textarea = $("#prompt");
  const msg = textarea.value.trim();
  if(!msg) return;
  const level = $("#level").value;

  const chat = state.chats.find(c=>c.id===state.activeChatId);
  chat.messages.push({ role:"user", content: msg });
  textarea.value = "";

  // optimistic render
  renderChat(state);
  setBusy(true);

  try{
    const data = await callAI({ message: msg, level });
    chat.messages.push({ role:"ai", content: data.answer || "(No answer)" });

    // auto-title first time
    if(chat.title === "New chat" || chat.title === "Welcome"){
      const title = (msg.length>32 ? msg.slice(0,32)+"…" : msg);
      chat.title = title;
    }

    saveState(state);
    renderAll(state);
  }catch(err){
    chat.messages.push({ role:"ai", content: "⚠️ Sorry — I couldn’t reach the server. Check your Render URL in app.js and try again.\n\n" + String(err.message||err) });
    saveState(state);
    renderAll(state);
  }finally{
    setBusy(false);
  }
}

function hookPdf(){
  const input = $("#pdfInput");
  const out = $("#uploadStatus");
  if(!input) return;

  input.addEventListener("change", async ()=>{
    const file = input.files?.[0];
    if(!file) return;
    out.textContent = `Selected: ${file.name} (for v1: paste key text into the chat)`;
  });
}

function renderAll(state){
  renderSidebar(state);
  renderChat(state);
}

window.addEventListener("DOMContentLoaded", ()=>{
  const state = loadState();
  if(!state){
    alert("Local storage error. Clear site data and reload.");
    return;
  }

  // Buttons
  $("#newChatBtn").onclick = ()=> newChat(state);
  $("#deleteChatBtn").onclick = ()=> deleteChat(state);
  $("#sendBtn").onclick = ()=> onSend(state);
  $("#prompt").addEventListener("keydown", (e)=>{
    if(e.key==="Enter" && !e.shiftKey){
      e.preventDefault();
      onSend(state);
    }
  });

  hookPdf();
  renderAll(state);
});