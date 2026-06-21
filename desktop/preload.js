const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Store
  storeGet: (key) => ipcRenderer.invoke('store-get', key),
  storeSet: (key, value) => ipcRenderer.invoke('store-set', key, value),
  storeDelete: (key) => ipcRenderer.invoke('store-delete', key),
  
  // Database
  dbRun: (sql, params) => ipcRenderer.invoke('db-run', sql, params),
  dbAll: (sql, params) => ipcRenderer.invoke('db-all', sql, params),
  
  // PDF
  generatePdf: (htmlContent) => ipcRenderer.invoke('generate-pdf', htmlContent),
});
