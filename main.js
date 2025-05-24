const { app, BrowserWindow, ipcMain, dialog, protocol } = require('electron');
const path = require('path');
const fs = require("fs");
const os = require("os");

const userDocuments = path.join(os.homedir(), "Documents");
const PROJECT_ROOT = path.join(userDocuments, "Bright_GE Projects");

if (!fs.existsSync(PROJECT_ROOT)) fs.mkdirSync(PROJECT_ROOT);

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: path.join(__dirname, "preload.js"),
      webSecurity: false // Allow loading local resources
    },
  });

  win.loadURL('http://localhost:5173');
  // Uncomment the following line for debugging
  // win.webContents.openDevTools();
  return win;
}

// Store the created window reference
let mainWindow = null;

app.whenReady().then(() => {
  // Register protocol
  protocol.registerFileProtocol('local-resource', (request, callback) => {
    const filePath = request.url.replace('local-resource://', '');
    try {
      return callback(decodeURIComponent(filePath));
    } catch (error) {
      console.error(error);
    }
  });

  mainWindow = createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

ipcMain.handle("import-files", async (event, { projectName, files }) => {
  const projectPath = path.join(PROJECT_ROOT, projectName);

  try {
    if (!fs.existsSync(projectPath)) {
      fs.mkdirSync(projectPath, { recursive: true }); // Ensure project folder is created
    }

    for (const file of files) {
      if (!fs.existsSync(file)) {
        console.error(`File does not exist: ${file}`);
        continue;
      }
      const stat = fs.statSync(file);

      if (!stat.isFile()) {
        console.error(`Not a valid file: ${file}`);
        continue;
      }

      const base = path.basename(file);
      const destPath = path.join(projectPath, base);

      // Avoid overwrite issues by renaming if file exists
      let finalPath = destPath;
      let counter = 1;
      while (fs.existsSync(finalPath)) {
        const ext = path.extname(base);
        const name = path.basename(base, ext);
        finalPath = path.join(projectPath, `${name}_${counter}${ext}`);
        counter++;
      }

      fs.copyFileSync(file, finalPath); // Copy file to the project directory
    }

    return fs.readdirSync(projectPath); // Return updated file list
  } catch (err) {
    console.error("File import error:", err);
    return [];
  }
});

ipcMain.handle("list-project-files", async (event, { projectName }) => {
  const projectPath = path.join(PROJECT_ROOT, projectName);
  if (!fs.existsSync(projectPath)) return [];
  return fs.readdirSync(projectPath);
});

ipcMain.handle("get-file-url", async (event, projectName, fileName) => {
  const filePath = path.join(PROJECT_ROOT, projectName, fileName);
  return `local-resource://${filePath}`;
});

ipcMain.handle("get-file-path", async (event, projectName, fileName) => {
  return path.join(PROJECT_ROOT, projectName, fileName);
});

ipcMain.handle("browse-files", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Select Files to Import",
    properties: ["openFile", "multiSelections"],
  });
  return result ? result.filePaths : [];
});


ipcMain.handle(
  "rename-project-file",
  async (event, { projectName, oldName, newName }) => {
    const projectPath = path.join(PROJECT_ROOT, projectName);
    const oldPath = path.join(projectPath, oldName);
    const newPath = path.join(projectPath, newName);

    if (fs.existsSync(oldPath)) {
      fs.renameSync(oldPath, newPath); // Rename the file
      return true;
    }
    return false;
  }
);

ipcMain.handle(
  "delete-project-file",
  async (event, { projectName, fileName }) => {
    const projectPath = path.join(PROJECT_ROOT, projectName);
    const filePath = path.join(projectPath, fileName);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath); // Delete the file
      return true;
    }
    return false;
  }
);