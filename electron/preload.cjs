const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // future APIs go here
});