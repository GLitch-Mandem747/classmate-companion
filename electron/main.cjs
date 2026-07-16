const { app, BrowserWindow } = require("electron");
const path = require("path");

const isDev = !app.isPackaged;

function createWindow() {

  const win = new BrowserWindow({
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

    win.loadURL("http://localhost:8080");

    // Uncomment if you want debugging
    // win.webContents.openDevTools();

  } else {

    win.loadFile(
      path.join(__dirname, "../dist/index.html")
    );

  }


  win.webContents.on("did-fail-load", (event, errorCode, errorDescription) => {
    console.log(
      `Failed to load: ${errorCode} - ${errorDescription}`
    );
  });


  win.webContents.on("did-finish-load", () => {
    console.log("Window loaded successfully.");
  });

}


app.whenReady().then(() => {

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