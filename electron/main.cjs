// frontend/react-app/electron/main.cjs
const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');

let mainWindow = null;

// Single instance lock (prevent multiple app instances)
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  function createWindow() {
    mainWindow = new BrowserWindow({
      width: 1366,
      height: 820,
      minWidth: 1024,
      minHeight: 700,
      show: false,
      title: 'LMS - Lodge Management System',
      icon: path.join(__dirname, '../public/icon.ico'),
      backgroundColor: '#0f172a',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.cjs'),
      },
    });

    // Remove default top menu for a modern, distraction-free desktop feel
    Menu.setApplicationMenu(null);

    // Development vs Production loading
    const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

    if (isDev && process.env.ELECTRON_START_URL) {
      mainWindow.loadURL(process.env.ELECTRON_START_URL);
    } else if (isDev) {
      mainWindow.loadURL('http://localhost:5173/');
    } else {
      mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    // Smooth entrance once DOM is rendered
    mainWindow.once('ready-to-show', () => {
      mainWindow.show();
    });

    // Open external links (WhatsApp, Google Maps, Phone) in system default browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith('http:') || url.startsWith('https:') || url.startsWith('mailto:') || url.startsWith('tel:')) {
        shell.openExternal(url);
        return { action: 'deny' };
      }
      return { action: 'allow' };
    });

    mainWindow.on('closed', () => {
      mainWindow = null;
    });
  }

  app.whenReady().then(createWindow);

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}
