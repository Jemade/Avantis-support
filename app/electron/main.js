// PC Assist desktop shell.
//
// What this file does, in order:
//   1. Starts the PC Assist backend (the same backend used by the browser
//      version) as a background process.
//   2. Opens a window and loads the same front end used by the browser
//      version (the built files in resources/frontend).
//   3. Closes the backend when the window closes.
//
// Nothing about PC Assist itself was changed to make this work. Only two
// small packaging settings were added so a plain double-clickable app could
// load the same front end and reach the same backend (see the "What was
// added for the desktop version" section of README.txt in this folder).

const { app, BrowserWindow, shell, dialog } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const http = require("http");

const isPackaged = app.isPackaged;
const BACKEND_PORT = 9140;
const BACKEND_URL = `http://127.0.0.1:${BACKEND_PORT}`;

// In a packaged app, resources/ sits next to the app's own files.
// In development (npm start), it sits in this same electron/ folder.
const resourcesDir = isPackaged ? process.resourcesPath : path.join(__dirname, "resources");
const frontendIndex = path.join(resourcesDir, "frontend", "index.html");
const backendExe = path.join(
  resourcesDir,
  "backend",
  process.platform === "win32" ? "pcassist-backend.exe" : "pcassist-backend"
);

let backendProcess = null;
let mainWindow = null;

function startBackend() {
  if (!isPackaged) {
    // Development: run the Python source directly with `python main.py`,
    // matching backend/run.bat / run.sh exactly.
    const devBackend = path.join(__dirname, "..", "backend");
    backendProcess = spawn("python", ["main.py"], { cwd: devBackend });
  } else {
    // Packaged: run the bundled backend program. It needs nothing installed
    // on the user's computer, Python included.
    backendProcess = spawn(backendExe, [], { cwd: path.dirname(backendExe) });
  }
  backendProcess.on("error", (error) => {
    console.error("Could not start the PC Assist backend:", error);
  });
  backendProcess.stdout && backendProcess.stdout.on("data", (d) => console.log(String(d)));
  backendProcess.stderr && backendProcess.stderr.on("data", (d) => console.error(String(d)));
}

function stopBackend() {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
}

// The window opens right away; it does not need to wait for the backend.
// Every page already shows "Reading this computer..." and then quietly
// retries until the backend answers, so the app corrects itself within a
// second or two of the window appearing.
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    title: "PC Assist",
    backgroundColor: "#f4f7f8",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.loadFile(frontendIndex);

  // Links such as "Update now" open in the user's normal browser, not
  // inside the app window.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}


// ---------------------------------------------------------------------------
// Automatic updates.
//
// When you publish a new version on GitHub Releases, installed copies of the
// app find it (when the computer is online), download it quietly, and offer
// to restart into the new version. Only runs in the installed app, never in
// development (npm start).
// ---------------------------------------------------------------------------
function tell(options) {
  return mainWindow ? dialog.showMessageBox(mainWindow, options) : dialog.showMessageBox(options);
}

function setupAutoUpdate() {
  if (!isPackaged) return;

  let autoUpdater;
  try {
    ({ autoUpdater } = require("electron-updater"));
  } catch (error) {
    console.error("Auto-update is not available:", error);
    return;
  }

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on("update-available", (info) => {
    tell({
      type: "info",
      title: "Update available",
      message: `PC Assist ${info.version} is available.`,
      detail: "It is downloading in the background. You can keep using the app.",
      buttons: ["OK"],
    });
  });

  autoUpdater.on("update-downloaded", (info) => {
    tell({
      type: "info",
      title: "Update ready",
      message: `PC Assist ${info.version} has been downloaded.`,
      detail: "Restart now to finish updating, or it will install the next time you close the app.",
      buttons: ["Restart now", "Later"],
      defaultId: 0,
      cancelId: 1,
    }).then(({ response }) => {
      if (response === 0) {
        stopBackend();
        autoUpdater.quitAndInstall();
      }
    });
  });

  autoUpdater.on("error", (error) => {
    // Being offline is normal. Never bother the user with this.
    console.error("Update check failed:", error && error.message ? error.message : error);
  });

  const check = () => autoUpdater.checkForUpdates().catch(() => {});
  setTimeout(check, 5000);                    // shortly after the app opens
  setInterval(check, 4 * 60 * 60 * 1000);     // then every 4 hours while it stays open
}

app.whenReady().then(() => {
  startBackend();
  createWindow();
  setupAutoUpdate();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  stopBackend();
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", stopBackend);

// Exposed only for the smoke-test script (scripts/smoke-test.js); harmless
// to leave in, the app itself never calls it.
module.exports = { BACKEND_URL };
