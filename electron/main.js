// Main Electron Process
import { app, BrowserWindow, Tray, Menu, globalShortcut, Notification, nativeImage, ipcMain, shell, desktopCapturer, screen } from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { startServer, stopServer } from '../backend/server.js';
import { closeDatabase } from '../backend/db/connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Keep references to windows
let mainWindow = null;
let selectorWindow = null;
let dashboardWindow = null;
let tray = null;
let backendServer = null;

// Backend port
const BACKEND_PORT = process.env.PORT || 3000;
const FRONTEND_PORT = 3001;

/**
 * Create the main application window (hidden by default, runs in tray)
 */
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 300,
    show: false, // Don't show by default
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.js')
    }
  });

  // Main window doesn't need to load anything - it's just for app lifecycle
  // mainWindow.loadFile(join(__dirname, 'snippet-selector.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

/**
 * Create the screen snippet selector window (fullscreen overlay)
 */
function createSnippetSelectorWindow() {
  if (selectorWindow) {
    selectorWindow.focus();
    return selectorWindow;
  }

  // Get all displays and find the bounds that cover all of them
  const displays = screen.getAllDisplays();
  
  let minX = 0, minY = 0, maxX = 0, maxY = 0;
  displays.forEach(display => {
    const bounds = display.bounds;
    minX = Math.min(minX, bounds.x);
    minY = Math.min(minY, bounds.y);
    maxX = Math.max(maxX, bounds.x + bounds.width);
    maxY = Math.max(maxY, bounds.y + bounds.height);
  });

  const width = maxX - minX;
  const height = maxY - minY;

  selectorWindow = new BrowserWindow({
    width: width,
    height: height,
    x: minX,
    y: minY,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    focusable: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.js')
    }
  });

  selectorWindow.setIgnoreMouseEvents(false);
  selectorWindow.setFullScreenable(false);
  selectorWindow.loadFile(join(__dirname, 'snippet-selector.html'));

  selectorWindow.on('closed', () => {
    selectorWindow = null;
  });

  // Focus the window
  selectorWindow.focus();
  selectorWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  return selectorWindow;
}

/**
 * Create dashboard window (embedded Next.js)
 */
function createDashboardWindow() {
  if (dashboardWindow) {
    dashboardWindow.focus();
    return dashboardWindow;
  }

  dashboardWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'Deep Shield Dashboard',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Load Next.js dashboard (assuming it's running on localhost:3001)
  dashboardWindow.loadURL(`http://localhost:${FRONTEND_PORT}/dashboard`);

  dashboardWindow.on('closed', () => {
    dashboardWindow = null;
  });

  return dashboardWindow;
}

/**
 * Create system tray
 */
function createTray() {
  // Create a simple icon (you can replace this with an actual icon file)
  // For now, create a minimal icon - try to load from public folder
  let icon;
  try {
    // Try to load an icon file if it exists
    const iconPath = join(__dirname, '..', 'frontend', 'public', 'icon.svg');
    icon = nativeImage.createFromPath(iconPath);
    if (icon.isEmpty()) {
      throw new Error('Icon is empty');
    }
  } catch (error) {
    // Fallback: use a simple empty icon
    // On macOS, an empty icon will show a default system icon
    icon = nativeImage.createEmpty();
  }
  
  tray = new Tray(icon);
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open Dashboard',
      click: () => {
        createDashboardWindow();
      }
    },
    {
      label: 'Capture & Analyze',
      click: () => {
        showSnippetSelector();
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setToolTip('Deep Shield - Deepfake Detection');
  tray.setContextMenu(contextMenu);
}

/**
 * Show snippet selector window (triggered by shortcut or menu)
 */
function showSnippetSelector() {
  createSnippetSelectorWindow();
}

/**
 * Register global shortcut
 */
function registerGlobalShortcut() {
  const ret = globalShortcut.register('CommandOrControl+Shift+A', () => {
    console.log('Global shortcut pressed: Cmd+Shift+A');
    showSnippetSelector();
  });

  if (!ret) {
    console.error('Failed to register global shortcut');
  } else {
    console.log('Global shortcut registered: Cmd+Shift+A');
  }
}

/**
 * Show notification with analysis results
 */
function showAnalysisNotification(result) {
  const { fake_probability, confidence } = result;
  const fakePercent = (fake_probability * 100).toFixed(1);
  const confPercent = (confidence * 100).toFixed(1);
  
  let status = 'Authentic';
  if (fake_probability > 0.7) {
    status = 'Likely Deepfake';
  } else if (fake_probability > 0.4) {
    status = 'Uncertain';
  }

  const notification = new Notification({
    title: `Deepfake Analysis: ${status}`,
    body: `Fake Probability: ${fakePercent}% | Confidence: ${confPercent}%`,
    urgency: fake_probability > 0.7 ? 'critical' : 'normal'
  });

  notification.on('click', () => {
    createDashboardWindow();
  });

  notification.show();
}

// IPC Handlers
ipcMain.handle('get-sources', async () => {
  const sources = await desktopCapturer.getSources({
    types: ['window', 'screen'],
    thumbnailSize: { width: 150, height: 150 }
  });
  return sources;
});

ipcMain.handle('capture-source', async (event, sourceId) => {
  try {
    // The actual capture happens in the renderer process
    // This handler just passes the sourceId and port to the renderer
    // The renderer will handle the capture using capture.js
    return { success: true, sourceId, port: BACKEND_PORT };
  } catch (error) {
    console.error('Capture error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('analysis-complete', async (event, result) => {
  showAnalysisNotification(result);
  return { success: true };
});

ipcMain.handle('get-backend-port', () => {
  return BACKEND_PORT;
});

ipcMain.handle('show-error', async (event, message) => {
  const notification = new Notification({
    title: 'Deepfake Analysis Error',
    body: message,
    urgency: 'critical'
  });
  notification.show();
  return { success: true };
});

ipcMain.on('window-close', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (window) {
    window.close();
  }
});

// App event handlers
app.whenReady().then(async () => {
  // Start embedded backend server
  try {
    backendServer = await startServer(BACKEND_PORT);
    console.log('Backend server started');
  } catch (error) {
    console.error('Failed to start backend server:', error);
    // Continue anyway - user might have backend running separately
  }

  // Create main window (hidden)
  createMainWindow();

  // Create system tray
  createTray();

  // Hide dock icon on macOS
  if (process.platform === 'darwin') {
    app.dock.hide();
  }

  // Register global shortcut
  registerGlobalShortcut();

  // Handle app activation (macOS)
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('will-quit', () => {
  // Unregister global shortcut
  globalShortcut.unregisterAll();
  
  // Stop backend server
  if (backendServer) {
    stopServer().catch(console.error);
  }
  
  // Close database connection
  closeDatabase().catch(console.error);
});

app.on('window-all-closed', () => {
  // Don't quit on macOS when all windows are closed (app runs in tray)
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle external dashboard access
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});

