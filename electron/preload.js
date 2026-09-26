const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  listModels: () => ipcRenderer.invoke("models:list"),
  addModel: (payload) => ipcRenderer.invoke("models:add", payload),
  removeModel: (id) => ipcRenderer.invoke("models:remove", id),
  refreshModel: (id) => ipcRenderer.invoke("models:refresh", id),
  refreshAll: () => ipcRenderer.invoke("models:refresh-all"),
  setIgnoreMouse: (ignore) => ipcRenderer.send("mouse:ignore", ignore),
  onModelsUpdated: (cb) => {
    const handler = (_e, list) => cb(list);
    ipcRenderer.on("models:updated", handler);
    return () => ipcRenderer.removeListener("models:updated", handler);
  },
});
