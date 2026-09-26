const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, screen, safeStorage } = require("electron");
const path = require("path");
const Store = require("electron-store");
const { fetchBalance } = require("./providers");

const store = new Store({
  name: "api-watch",
  defaults: {
    models: [],
    side: "right",
    topPercent: 50,
  },
});

let mainWindow = null;
let tray = null;
let refreshTimer = null;

function encrypt(text) {
  if (!text) return "";
  if (safeStorage.isEncryptionAvailable()) {
    return safeStorage.encryptString(text).toString("base64");
  }
  return Buffer.from(text, "utf8").toString("base64");
}

function decrypt(payload) {
  if (!payload) return "";
  try {
    if (safeStorage.isEncryptionAvailable()) {
      return safeStorage.decryptString(Buffer.from(payload, "base64"));
    }
    return Buffer.from(payload, "base64").toString("utf8");
  } catch {
    return "";
  }
}

function publicModels() {
  return store.get("models").map((m) => ({
    id: m.id,
    provider: m.provider,
    name: m.name,
    icon: m.icon,
    unit: m.unit || "CNY",
    balance: m.balance ?? null,
    lastSync: m.lastSync || null,
    error: m.error || null,
    note: m.note || null,
    noBalanceApi: !!m.noBalanceApi,
  }));
}

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width,
    height,
    x: 0,
    y: 0,
    transparent: true,
    frame: false,
    resizable: false,
    movable: false,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    hasShadow: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.setAlwaysOnTop(true, "screen-saver");
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  mainWindow.setIgnoreMouseEvents(true, { forward: true });

  mainWindow.loadFile(path.join(__dirname, "..", "renderer", "index.html"));

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    refreshAllBalances();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function createTray() {
  const iconPath = path.join(__dirname, "..", "icons", "deepseek.png");
  let image = nativeImage.createFromPath(iconPath);
  if (!image.isEmpty()) {
    image = image.resize({ width: 16, height: 16 });
  } else {
    image = nativeImage.createEmpty();
  }

  tray = new Tray(image);
  tray.setToolTip("API Watch");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: "刷新全部余额",
        click: () => refreshAllBalances(),
      },
      {
        label: "显示 / 置顶",
        click: () => {
          if (!mainWindow) return;
          mainWindow.show();
          mainWindow.setAlwaysOnTop(true, "screen-saver");
        },
      },
      { type: "separator" },
      {
        label: "退出",
        click: () => {
          app.isQuiting = true;
          app.quit();
        },
      },
    ])
  );

  tray.on("click", () => {
    if (!mainWindow) return;
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
  });
}

async function refreshOne(model) {
  const key = decrypt(model.keyEnc);
  if (!key) {
    model.error = "缺少 API Key";
    return model;
  }
  try {
    const result = await fetchBalance(model.provider, key);
    model.balance = result.balance ?? null;
    model.unit = result.unit || model.unit || "CNY";
    model.lastSync = Date.now();
    model.error = null;
    model.noBalanceApi = !!result.noBalanceApi;
    model.note = result.message || result.note || null;
  } catch (err) {
    model.error = err.message || "查询失败";
  }
  return model;
}

async function refreshAllBalances() {
  const models = store.get("models");
  for (let i = 0; i < models.length; i++) {
    models[i] = await refreshOne(models[i]);
  }
  store.set("models", models);
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("models:updated", publicModels());
  }
}

function startAutoRefresh() {
  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = setInterval(() => {
    refreshAllBalances();
  }, 1 * 60 * 1000);
}

function registerIpc() {
  ipcMain.handle("models:list", () => publicModels());

  ipcMain.handle("models:add", async (_e, payload) => {
    const { provider, name, apiKey, icon } = payload || {};
    if (!provider || !apiKey) {
      throw new Error("请填写提供商和 API Key");
    }

    const models = store.get("models");
    let id = provider;
    let n = 2;
    while (models.some((m) => m.id === id)) id = `${provider}-${n++}`;

    const model = {
      id,
      provider,
      name: name || provider,
      icon: icon || `icons/${provider}.png`,
      keyEnc: encrypt(apiKey.trim()),
      balance: null,
      unit: "CNY",
      lastSync: null,
      error: null,
    };

    await refreshOne(model);
    models.push(model);
    store.set("models", models);

    const list = publicModels();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("models:updated", list);
    }
    return list;
  });

  ipcMain.handle("models:remove", (_e, id) => {
    const next = store.get("models").filter((m) => m.id !== id);
    store.set("models", next);
    return publicModels();
  });

  ipcMain.handle("models:refresh", async (_e, id) => {
    const models = store.get("models");
    const idx = models.findIndex((m) => m.id === id);
    if (idx < 0) throw new Error("模型不存在");
    models[idx] = await refreshOne(models[idx]);
    store.set("models", models);
    const list = publicModels();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("models:updated", list);
    }
    return list.find((m) => m.id === id);
  });

  ipcMain.handle("models:refresh-all", async () => {
    await refreshAllBalances();
    return publicModels();
  });

  ipcMain.on("mouse:ignore", (_e, ignore) => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    mainWindow.setIgnoreMouseEvents(!!ignore, { forward: true });
  });
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();
    createTray();
    registerIpc();
    startAutoRefresh();
  });

  app.on("window-all-closed", (e) => {
    e.preventDefault();
  });

  app.on("before-quit", () => {
    if (refreshTimer) clearInterval(refreshTimer);
  });
}
