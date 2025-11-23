// Preload script - Secure IPC bridge
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Get available capture sources
  getSources: () => ipcRenderer.invoke('get-sources'),
  
  // Capture a specific source
  captureSource: (sourceId) => ipcRenderer.invoke('capture-source', sourceId),
  
  // Notify main process that analysis is complete
  analysisComplete: (result) => ipcRenderer.invoke('analysis-complete', result),
  
  // Get backend port
  getBackendPort: () => ipcRenderer.invoke('get-backend-port'),
  
  // Show error notification
  showError: (message) => ipcRenderer.invoke('show-error', message),
  
  // Close window
  closeWindow: () => ipcRenderer.send('window-close')
});

