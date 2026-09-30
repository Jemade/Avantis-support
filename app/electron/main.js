// PC Assist desktop shell.
//
// What this file does, in order:
//   1. Starts the PC Assist backend (the same backend used by the browser
//      version) as a background process.
//   2. Opens a window and loads the same front end used by the browser
//      version (the built files in resources/frontend).
//   3. Checks GitHub for a newer published version, on a timer, and offers
//      to install it when one is found.
//   4. Closes the backend when the window closes.
//
// Nothing about PC Assist itself was changed to make this work. Only two
// small packaging settings were added so a plain double-clickable app could
// load the same front end and reach the same backend (see the "What was
// added for the desktop version" section of README.txt in this folder).
// The update checking in this file is new; see "HOW UPDATES WORK" below.

const { app, BrowserWindow, shell, dialog } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const { autoUpdater } = require("electron-updater");

const isPackaged = app.isPackaged;
const BACKEND_PORT = 9140;
const BACKEND_URL = `http://127.0.0.1:${BACKEND_PORT}`;

// ---------------------------------------------------------------------
// HOW UPDATES WORK (read this before changing anything below)
//
// This app checks the "Releases" page of the GitHub repository named
// below for a version newer than the one currently installed. It looks
// at a small file called latest.yml that the build step creates
// automatically; it does not look at your source code or commits.
//
// So pushing code to GitHub, by itself, does NOT update anyone's
// installed copy. An update only appears after you:
//   1. Raise "version" in electron/package.json (e.g. 1.0.0 -> 1.0.1)
//   2. Rebuild the installer (build-windows.bat, or `npm run dist`
//      inside electron/)
//   3. Publish a new GitHub Release, with that same version as the tag
//      (e.g. v1.0.1), and upload the three files this build produced
//      in electron/dist-installer/: the .exe, the .exe.blockmap, and
//      latest.yml
//
// Once that Release is published, every installed copy that has this
// update-checking code notices it on its own, downloads it in the
// background, and offers to restart and install it.
//
// IMPORTANT: a copy of PC Assist installed from a build made BEFORE
// this file existed has no update-checking code at all, so it can
// never update itself. Such a copy has to be replaced once by hand
// with a build made from this file. Every version after that can
// update automatically.
//
// Update the two lines below to match your own GitHub repository if
// they are ever different (they must also match the "publish" section
// near the bottom of electron/package.json):
const UPDATE_REPO_OWNER = "Jemade";
const UPDATE_REPO_NAME = "Avantis-support";

// How often the app checks for an update WHILE IT STAYS OPEN.
// To change how often, edit the number below (it is in milliseconds:
// 1000 = 1 second). It also always checks once, a few seconds after
// opening. This does not affect how fast an update installs once
// found, only how soon the app notices a newly published one.
const UPDATE_CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000; // 4 hours
const FIRST_CHECK_DELAY_MS = 5 * 1000; // 5 seconds after opening
// ---------------------------------------------------------------------

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
let updateReadyToInstall = false;

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
    show: false,
    icon: path.join(__dirname, "build", "icon.ico"),
    title: "PC Assist",
    backgroundColor: "#f4f4f4",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.once("ready-to-show", () => mainWindow.show());
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

// ---------------------------------------------------------------------
// Update checking. This never interrupts the person using the app: it
// downloads quietly in the background, and only ever shows one small
// box, asking to restart, once a download has fully finished.
// ---------------------------------------------------------------------

function setUpAutoUpdates() {
  if (!isPackaged) return; // no installed copy to update while developing

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.setFeedURL({
    provider: "github",
    owner: UPDATE_REPO_OWNER,
    repo: UPDATE_REPO_NAME,
  });

  autoUpdater.on("error", (error) => {
    // Common, harmless causes: no internet right now, or no Release
    // published yet. The app keeps working normally either way.
    console.error("Update check failed:", error == null ? "unknown error" : error.toString());
  });

  autoUpdater.on("update-downloaded", (info) => {
    updateReadyToInstall = true;
    dialog
      .showMessageBox(mainWindow, {
        type: "info",
        buttons: ["Restart now", "Later"],
        defaultId: 0,
        cancelId: 1,
        title: "Update ready",
        message: `PC Assist ${info.version} has downloaded.`,
        detail: "Restart now to finish installing it, or install it automatically the next time you close PC Assist.",
      })
      .then((result) => {
        if (result.response === 0) autoUpdater.quitAndInstall();
      });
  });

  const checkForUpdates = () => {
    autoUpdater.checkForUpdates().catch((error) => {
      console.error("Update check failed:", error == null ? "unknown error" : error.toString());
    });
  };

  setTimeout(checkForUpdates, FIRST_CHECK_DELAY_MS);
  setInterval(checkForUpdates, UPDATE_CHECK_INTERVAL_MS);
}

app.whenReady().then(() => {
  startBackend();
  createWindow();
  setUpAutoUpdates();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  stopBackend();
  // If an update finished downloading while the app was open,
  // autoInstallOnAppQuit (set above) installs it now, automatically.
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", stopBackend);

// Exposed only for the smoke-test script (scripts/smoke-test.js); harmless
// to leave in, the app itself never calls it.
module.exports = { BACKEND_URL };
