const PROVIDER_META = {
  deepseek: { name: "DeepSeek", icon: "../icons/deepseek.png", letter: "DS", color: "#4D6BFE" },
  openai: { name: "OpenAI", icon: "../icons/openai.png", letter: "OA", color: "#10A37F" },
  anthropic: { name: "Claude", icon: "../icons/claude.png", letter: "C", color: "#D4A27F" },
  gemini: { name: "Gemini", icon: "../icons/gemini.png", letter: "G", color: "#8AB4F8" },
  qwen: { name: "通义千问", icon: "../icons/qwen.png", letter: "Q", color: "#615CED" },
  moonshot: { name: "Kimi", icon: "../icons/kimi.png", letter: "K", color: "#6B7CFF" },
  doubao: { name: "豆包", icon: "../icons/doubao.png", letter: "豆", color: "#3B82F6" },
};

const state = {
  models: [],
  activeId: null,
  side: "right",
  expanded: false,
};

const dock = document.getElementById("dock");
const dockList = document.getElementById("dockList");
const addBtn = document.getElementById("addBtn");
const balancePanel = document.getElementById("balancePanel");
const balName = document.getElementById("balName");
const balAmount = document.getElementById("balAmount");
const balUnit = document.getElementById("balUnit");
const balMeta = document.getElementById("balMeta");
const balIcon = document.getElementById("balIcon");
const balDot = document.getElementById("balDot");
const modalMask = document.getElementById("modalMask");
const providerSelect = document.getElementById("providerSelect");
const apiKeyInput = document.getElementById("apiKeyInput");
const formError = document.getElementById("formError");
const confirmAdd = document.getElementById("confirmAdd");
const cancelAdd = document.getElementById("cancelAdd");
const refreshOneBtn = document.getElementById("refreshOne");
const removeOneBtn = document.getElementById("removeOne");

function metaFor(m) {
  return PROVIDER_META[m.provider] || PROVIDER_META[m.id] || {
    name: m.name || m.id,
    icon: m.icon,
    letter: (m.name || "AI").slice(0, 2),
    color: "#555",
  };
}

function iconSrc(m) {
  const meta = metaFor(m);
  if (m.icon && !m.icon.startsWith("icons/")) return m.icon;
  if (m.icon) return `../${m.icon}`;
  return meta.icon;
}

function levelClass(amount) {
  if (amount == null || Number.isNaN(amount)) return "warn";
  if (amount < 10) return "low";
  if (amount < 30) return "warn";
  return "ok";
}

function formatTime(ts) {
  if (!ts) return "尚未同步";
  const d = Date.now() - ts;
  if (d < 15_000) return "刚刚";
  if (d < 60_000) return `${Math.floor(d / 1000)} 秒前`;
  if (d < 3_600_000) return `${Math.floor(d / 60_000)} 分钟前`;
  return new Date(ts).toLocaleTimeString();
}

function iconHtml(m) {
  const meta = metaFor(m);
  const src = iconSrc(m);
  if (src) return `<img src="${src}" alt="${meta.name}" />`;
  return `<div class="fallback" style="background:${meta.color}">${meta.letter}</div>`;
}

function setModels(list) {
  state.models = list || [];
  renderIcons();
  if (state.activeId) {
    const m = state.models.find((x) => x.id === state.activeId);
    if (m) showBalance(m, false);
    else {
      state.activeId = null;
      balancePanel.classList.remove("open");
    }
  }
}

function renderIcons() {
  dockList.innerHTML = "";
  state.models.forEach((m) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "model-btn" + (state.activeId === m.id ? " active" : "");
    btn.title = metaFor(m).name;
    const lvl = m.error ? "low" : m.noBalanceApi ? "warn" : levelClass(m.balance);
    btn.innerHTML = iconHtml(m) + `<span class="status ${lvl}"></span>`;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleBalance(m.id);
    });
    dockList.appendChild(btn);
  });
}

function showBalance(m, toggleOffIfSame) {
  if (toggleOffIfSame && state.activeId === m.id) {
    state.activeId = null;
    balancePanel.classList.remove("open");
    renderIcons();
    return;
  }

  state.activeId = m.id;
  const meta = metaFor(m);
  balName.textContent = m.name || meta.name;
  balIcon.innerHTML = iconHtml(m);
  balUnit.textContent = m.unit || "CNY";

  if (m.error) {
    balAmount.textContent = "失败";
    balAmount.className = "amount error-text";
    balMeta.textContent = m.error;
    balDot.style.background = "var(--low)";
  } else if (m.noBalanceApi || m.balance == null) {
    balAmount.textContent = m.noBalanceApi ? "控制台" : "--";
    balAmount.className = "amount warn";
    balUnit.textContent = m.unit || "";
    balMeta.textContent = m.note || (m.noBalanceApi ? "无公开余额接口" : "同步中…");
    balDot.style.background = "var(--warn)";
  } else {
    const lvl = levelClass(m.balance);
    balAmount.textContent = Number(m.balance).toFixed(2);
    balAmount.className = `amount ${lvl}`;
    balMeta.textContent = `已同步 · ${formatTime(m.lastSync)}`;
    balDot.style.background =
      lvl === "ok" ? "var(--ok)" : lvl === "warn" ? "var(--warn)" : "var(--low)";
  }
  balDot.style.boxShadow = `0 0 8px ${balDot.style.background}`;
  balancePanel.classList.add("open");
  renderIcons();
}

function toggleBalance(id) {
  const m = state.models.find((x) => x.id === id);
  if (!m) return;
  showBalance(m, true);
}

function setExpanded(on) {
  state.expanded = on;
  dock.classList.toggle("expanded", on);
}

/* click-through: only interact when over dock / modal */
function updateClickThrough(clientX, clientY) {
  if (!window.api) return;
  const el = document.elementFromPoint(clientX, clientY);
  const over = !!(el && el.closest(".dock, .modal-mask.show, .modal"));
  window.api.setIgnoreMouse(!over);
}

document.addEventListener(
  "mousemove",
  (e) => updateClickThrough(e.clientX, e.clientY),
  { passive: true }
);

let leaveTimer = null;
dock.addEventListener("pointerenter", () => {
  clearTimeout(leaveTimer);
  setExpanded(true);
  if (window.api) window.api.setIgnoreMouse(false);
});
dock.addEventListener("pointerleave", () => {
  leaveTimer = setTimeout(() => {
    if (modalMask.classList.contains("show")) return;
    setExpanded(false);
    state.activeId = null;
    balancePanel.classList.remove("open");
    renderIcons();
  }, 220);
});

let scrollBlurTimer = null;
dockList.addEventListener(
  "scroll",
  () => {
    dock.classList.add("scrolling");
    clearTimeout(scrollBlurTimer);
    scrollBlurTimer = setTimeout(() => dock.classList.remove("scrolling"), 120);
  },
  { passive: true }
);

/* vertical drag */
let dragging = false;
let startY = 0;
let startTop = 0;

function dockTopPercent() {
  const rect = dock.getBoundingClientRect();
  return ((rect.top + rect.height / 2) / window.innerHeight) * 100;
}

function applyTop(pct) {
  dock.style.top = `${Math.min(88, Math.max(12, pct))}%`;
}

dock.addEventListener("pointerdown", (e) => {
  if (e.target.closest("button") || e.target.closest(".dock-list") || e.target.closest(".balance-panel")) {
    return;
  }
  dragging = true;
  dock.classList.add("dragging");
  dock.setPointerCapture(e.pointerId);
  startY = e.clientY;
  startTop = dockTopPercent();
});

dock.addEventListener("pointermove", (e) => {
  if (!dragging) return;
  applyTop(startTop + ((e.clientY - startY) / window.innerHeight) * 100);
});

dock.addEventListener("pointerup", (e) => {
  if (!dragging) return;
  dragging = false;
  dock.classList.remove("dragging");
  try {
    dock.releasePointerCapture(e.pointerId);
  } catch (_) {}
});

/* modal */
addBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  formError.hidden = true;
  apiKeyInput.value = "";
  modalMask.classList.add("show");
  if (window.api) window.api.setIgnoreMouse(false);
  setTimeout(() => apiKeyInput.focus(), 50);
});

cancelAdd.addEventListener("click", () => {
  modalMask.classList.remove("show");
});

modalMask.addEventListener("click", (e) => {
  if (e.target === modalMask) modalMask.classList.remove("show");
});

confirmAdd.addEventListener("click", async () => {
  formError.hidden = true;
  const provider = providerSelect.value;
  const apiKey = apiKeyInput.value.trim();
  if (!apiKey) {
    formError.textContent = "请填写 API Key";
    formError.hidden = false;
    return;
  }

  const meta = PROVIDER_META[provider];
  confirmAdd.disabled = true;
  confirmAdd.textContent = "查询中…";
  try {
    const list = await window.api.addModel({
      provider,
      name: meta.name,
      apiKey,
      icon: `icons/${provider === "moonshot" ? "kimi" : provider === "anthropic" ? "claude" : provider}.png`,
    });
    setModels(list);
    modalMask.classList.remove("show");
    apiKeyInput.value = "";
    const added = list[list.length - 1];
    if (added) {
      setExpanded(true);
      showBalance(added, false);
    }
  } catch (err) {
    formError.textContent = err.message || String(err);
    formError.hidden = false;
  } finally {
    confirmAdd.disabled = false;
    confirmAdd.textContent = "添加并查询";
  }
});

refreshOneBtn.addEventListener("click", async (e) => {
  e.stopPropagation();
  if (!state.activeId) return;
  balMeta.textContent = "刷新中…";
  try {
    const updated = await window.api.refreshModel(state.activeId);
    const list = await window.api.listModels();
    setModels(list);
    if (updated) showBalance(updated, false);
  } catch (err) {
    balMeta.textContent = err.message || "刷新失败";
  }
});

removeOneBtn.addEventListener("click", async (e) => {
  e.stopPropagation();
  if (!state.activeId) return;
  if (!confirm("确定移除此模型配置？")) return;
  const list = await window.api.removeModel(state.activeId);
  state.activeId = null;
  balancePanel.classList.remove("open");
  setModels(list);
});

/* edge color (muted) */
function updateEdgeColor() {
  document.documentElement.style.setProperty("--edge", "rgba(190, 205, 220, 0.72)");
}

function playSplash() {
  const splash = document.getElementById("splash");
  if (!splash) {
    document.body.classList.remove("booting");
    return Promise.resolve();
  }

  if (window.api) window.api.setIgnoreMouse(false);

  return new Promise((resolve) => {
    // hold the composed frame, then leave
    const holdMs = 2100;
    setTimeout(() => {
      splash.classList.add("is-leaving");
      setTimeout(() => {
        document.body.classList.remove("booting");
        splash.remove();
        resolve();
      }, 860);
    }, holdMs);
  });
}

async function boot() {
  updateEdgeColor();
  const splashDone = playSplash();

  if (!window.api) {
    console.warn("Electron API missing — open via npm start");
    await splashDone;
    return;
  }

  const list = await window.api.listModels();
  setModels(list);
  window.api.onModelsUpdated((next) => setModels(next));
  await splashDone;
}

boot();
