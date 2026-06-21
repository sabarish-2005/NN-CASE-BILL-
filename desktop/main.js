const { app, BrowserWindow, ipcMain, protocol, net } = require('electron');
const path = require('path');
const Store = require('electron-store');
const Database = require('better-sqlite3');
const fs = require('fs');
const url = require('url');

const store = new Store();
let db;

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true, supportFetchAPI: true } }
]);

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (fs.existsSync(path.join(__dirname, 'app-build'))) {
    win.loadURL('app://localhost/');
  } else {
    win.loadURL('http://localhost:8081');
  }
}

app.whenReady().then(() => {
  protocol.handle('app', (request) => {
    const parsedUrl = new URL(request.url);
    let pathname = decodeURIComponent(parsedUrl.pathname);
    if (pathname === '/') pathname = '/index.html';
    
    let filePath = path.join(__dirname, 'app-build', pathname);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(__dirname, 'app-build', 'index.html');
    }
    
    return net.fetch(url.pathToFileURL(filePath).toString());
  });

  // Initialize SQLite Database
  const dbPath = path.join(app.getPath('userData'), 'nnbilling.db');
  db = new Database(dbPath);

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// --- IPC Handlers for React Native Web to communicate with Electron ---

// Key-Value Storage (Replaces expo-secure-store)
ipcMain.handle('store-get', (event, key) => store.get(key));
ipcMain.handle('store-set', (event, key, value) => store.set(key, value));
ipcMain.handle('store-delete', (event, key) => store.delete(key));

// SQLite Database (Replaces expo-sqlite)
ipcMain.handle('db-run', (event, sql, params) => {
  try {
    const info = db.prepare(sql).run(params || []);
    return { success: true, changes: info.changes, lastInsertRowid: info.lastInsertRowid };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db-all', (event, sql, params) => {
  try {
    const rows = db.prepare(sql).all(params || []);
    return { success: true, rows };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// PDF Generation (Replaces expo-print)
ipcMain.handle('generate-pdf', async (event, htmlContent) => {
  try {
    const win = new BrowserWindow({ show: false });
    await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
    const pdfPath = path.join(app.getPath('temp'), `invoice_${Date.now()}.pdf`);
    const pdfData = await win.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4',
    });
    fs.writeFileSync(pdfPath, pdfData);
    win.close();
    return { success: true, uri: pdfPath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
