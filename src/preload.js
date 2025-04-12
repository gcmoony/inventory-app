const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("dbAPI", {
  getAllItems: () => ipcRenderer.invoke("db:getAllItems"),
  updateItem: (args) => ipcRenderer.invoke("db:updateItem", args),
  deleteItem: (args) => ipcRenderer.invoke("db:deleteItem", args),
  addItem: () => ipcRenderer.invoke("db:addNewItem"),
})
