const { app, BrowserWindow, ipcMain } = require("electron");
const { autoUpdater } = require("electron-updater");
const path = require("path");

const isDev = !app.isPackaged;
let mainWindow = null;

function sendUpdateStatus(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, payload);
  }
}

function setupAutoUpdater() {
  if (isDev) return;

  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on("checking-for-update", () => {
    sendUpdateStatus("update-checking");
  });

  autoUpdater.on("update-available", (info) => {
    sendUpdateStatus("update-available", {
      version: info.version,
    });
  });

  autoUpdater.on("update-not-available", () => {
    sendUpdateStatus("update-not-available");
  });

  autoUpdater.on("download-progress", (progress) => {
    sendUpdateStatus("update-download-progress", progress);
  });

  autoUpdater.on("update-downloaded", (info) => {
    sendUpdateStatus("update-downloaded", {
      version: info.version,
    });
  });

  autoUpdater.on("error", (error) => {
    sendUpdateStatus("update-error", error.message);
  });

  ipcMain.handle("check-for-updates", async () => {
    if (isDev) return null;
    try {
      return await autoUpdater.checkForUpdates();
    } catch (error) {
      sendUpdateStatus("update-error", error.message);
      return null;
    }
  });

  ipcMain.handle("download-update", async () => {
    if (isDev) return null;
    return autoUpdater.downloadUpdate();
  });

  ipcMain.handle("install-update", () => {
    if (isDev) return;
    autoUpdater.quitAndInstall();
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    icon: path.join(__dirname, "assets", "icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:8080");
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  mainWindow.webContents.on("did-fail-load", (_event, errorCode, errorDescription) => {
    console.log(`Failed to load: ${errorCode} - ${errorDescription}`);
  });

  mainWindow.webContents.on("did-finish-load", () => {
    console.log("Window loaded successfully.");
    if (!isDev) {
      autoUpdater.checkForUpdates().catch((error) => {
        sendUpdateStatus("update-error", error.message);
      });
    }
  });
}

app.whenReady().then(() => {
  setupAutoUpdater();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
