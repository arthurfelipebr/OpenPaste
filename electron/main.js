'use strict';

const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  Notification,
  ipcMain,
  shell,
  nativeImage,
} = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

// -------------------------------------------------------
// Forçar uma única instância do app
// -------------------------------------------------------
if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

// -------------------------------------------------------
// Módulos internos (carregados após app pronto)
// -------------------------------------------------------
let Store, AutoLaunch;
let store, autoLaunch;
let server, mdns;
let i18n;
let tray = null;
let settingsWindow = null;
let onboardingWindow = null;
let isServerRunning = false;

// -------------------------------------------------------
// Bootstrap
// -------------------------------------------------------
app.whenReady().then(async () => {
  // Esconder da taskbar/dock — roda apenas no tray
  if (app.dock) app.dock.hide();

  // Carregar dependências (ESM-safe)
  Store = require('electron-store');
  AutoLaunch = require('auto-launch');
  i18n = require('./i18n');

  store = new Store({
    defaults: {
      port: 9876,
      downloadPath: path.join(os.homedir(), 'Downloads', 'OpenPaste'),
      autoLaunch: false,
      locale: 'en',
      onboardingDone: false,
    },
  });

  autoLaunch = new AutoLaunch({ name: 'OpenPaste', isHidden: true });

  // Módulos do projeto
  server = require('./server');
  mdns = require('./mdns');

  setupTray();
  await startServer();

  // Primeira execução → onboarding; caso contrário → settings
  if (!store.get('onboardingDone')) {
    openOnboarding();
  } else {
    openSettings();
  }
});

// Segunda instância → focar janela aberta
app.on('second-instance', () => {
  if (onboardingWindow) {
    if (onboardingWindow.isMinimized()) onboardingWindow.restore();
    onboardingWindow.focus();
  } else if (settingsWindow) {
    if (settingsWindow.isMinimized()) settingsWindow.restore();
    settingsWindow.focus();
  } else {
    openSettings();
  }
});

// Manter o app rodando mesmo sem janelas abertas
app.on('window-all-closed', (e) => e.preventDefault());

// -------------------------------------------------------
// Helper: locale atual
// -------------------------------------------------------
function locale() {
  return store ? store.get('locale', 'en') : 'en';
}

function tr(key, vars) {
  return i18n ? i18n.t(locale(), key, vars) : key;
}

// -------------------------------------------------------
// Tray
// -------------------------------------------------------
function setupTray() {
  const iconPath = path.join(__dirname, 'assets', 'icon.png');
  const icon = nativeImage.createFromPath(iconPath);

  tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon);
  tray.setToolTip(tr('trayTooltipWaiting'));
  tray.on('double-click', openSettings);

  rebuildMenu();
}

function rebuildMenu() {
  if (!tray) return;

  const menu = Menu.buildFromTemplate([
    {
      label: 'OpenPaste',
      enabled: false,
    },
    { type: 'separator' },
    {
      label: isServerRunning ? tr('trayRunning') : tr('trayStopped'),
      enabled: false,
    },
    {
      label: isServerRunning ? tr('trayStopServer') : tr('trayStartServer'),
      click: () => (isServerRunning ? stopServer() : startServer()),
    },
    { type: 'separator' },
    {
      label: tr('traySettings'),
      click: openSettings,
    },
    {
      label: tr('trayOpenFolder'),
      click: () => {
        const dir = store.get('downloadPath');
        fs.mkdirSync(dir, { recursive: true });
        shell.openPath(dir);
      },
    },
    { type: 'separator' },
    {
      label: tr('trayQuit'),
      click: async () => {
        await stopServer();
        app.exit(0);
      },
    },
  ]);

  tray.setContextMenu(menu);
}

// -------------------------------------------------------
// Janela de onboarding (primeira execução)
// -------------------------------------------------------
function openOnboarding() {
  if (onboardingWindow) {
    onboardingWindow.focus();
    return;
  }

  onboardingWindow = new BrowserWindow({
    width: 620,
    height: 520,
    resizable: false,
    title: 'OpenPaste',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  onboardingWindow.loadFile(
    path.join(__dirname, 'renderer', 'onboarding', 'index.html')
  );

  onboardingWindow.on('closed', () => {
    onboardingWindow = null;
  });
}

// -------------------------------------------------------
// Janela de configurações
// -------------------------------------------------------
function openSettings() {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 560,
    height: 620,
    resizable: false,
    title: tr('settingsTitle'),
    icon: path.join(__dirname, 'assets', 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  settingsWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

// -------------------------------------------------------
// Servidor HTTP
// -------------------------------------------------------
const serverInstance = (() => {
  let instance = null;
  return {
    get() { return instance; },
    set(v) { instance = v; },
  };
})();

async function startServer() {
  if (isServerRunning) return;

  try {
    const { createServer } = require('./server');
    const { getHistory } = require('./server');
    void getHistory; // referenciado via IPC abaixo

    const srv = createServer({
      store,
      onReceive: handlePayload,
    });

    serverInstance.set(srv);
    const port = await srv.start();
    await mdns.advertise(port);

    isServerRunning = true;
    tray?.setToolTip(tr('trayTooltipRunning', { port }));
    rebuildMenu();

    console.log(`[main] Server started on port ${port}`);
  } catch (err) {
    console.error('[main] Failed to start server:', err);
    notify(tr('notifErrorTitle'), tr('notifErrorBody', { message: err.message }));
  }
}

async function stopServer() {
  if (!isServerRunning) return;

  try {
    await serverInstance.get()?.stop();
    await mdns.stop();
    isServerRunning = false;
    tray?.setToolTip(tr('trayTooltipStopped'));
    rebuildMenu();
    console.log('[main] Server stopped');
  } catch (err) {
    console.error('[main] Error stopping server:', err);
  }
}

// -------------------------------------------------------
// Handler de payload recebido
// -------------------------------------------------------
function handlePayload({ type, content, filename, filePath }) {
  if (type === 'text' || type === 'url') {
    notify(
      tr('notifCopied'),
      content.length > 80 ? content.slice(0, 80) + '…' : content
    );
  } else {
    const notif = notify(
      type === 'image' ? tr('notifImageReceived') : tr('notifFileReceived'),
      filename || path.basename(filePath),
      filePath
    );
    void notif;
  }

  // Atualizar janela de settings se estiver aberta
  if (settingsWindow) {
    const { getHistory } = require('./server');
    settingsWindow.webContents.send('history-update', getHistory());
  }
}

// -------------------------------------------------------
// Notificações nativas
// -------------------------------------------------------
function notify(title, body, filePath = null) {
  if (!Notification.isSupported()) return null;

  const notif = new Notification({ title, body, silent: false });

  if (filePath) {
    notif.on('click', () => shell.showItemInFolder(filePath));
  }

  notif.show();
  return notif;
}

// -------------------------------------------------------
// IPC — comunicação com a janela de configurações
// -------------------------------------------------------
ipcMain.handle('get-config', () => ({
  port: store.get('port'),
  downloadPath: store.get('downloadPath'),
  autoLaunch: store.get('autoLaunch'),
  localIP: mdns.getLocalIP(),
  isServerRunning,
}));

ipcMain.handle('get-history', () => {
  const { getHistory } = require('./server');
  return getHistory();
});

ipcMain.handle('save-config', async (_event, config) => {
  const needsRestart = config.port !== store.get('port');

  store.set('port', Number(config.port));
  store.set('downloadPath', config.downloadPath);

  // Auto-launch
  if (config.autoLaunch !== store.get('autoLaunch')) {
    store.set('autoLaunch', config.autoLaunch);
    try {
      if (config.autoLaunch) {
        await autoLaunch.enable();
      } else {
        await autoLaunch.disable();
      }
    } catch (err) {
      console.warn('[main] auto-launch error:', err.message);
    }
  }

  // Reiniciar servidor se porta mudou
  if (needsRestart && isServerRunning) {
    await stopServer();
    await startServer();
  }

  return { ok: true };
});

ipcMain.handle('toggle-server', async () => {
  if (isServerRunning) {
    await stopServer();
  } else {
    await startServer();
  }
  return { isServerRunning };
});

ipcMain.handle('open-folder', () => {
  const dir = store.get('downloadPath');
  fs.mkdirSync(dir, { recursive: true });
  shell.openPath(dir);
});

ipcMain.handle('pick-folder', async () => {
  const { dialog } = require('electron');
  const win = settingsWindow || onboardingWindow;
  const result = await dialog.showOpenDialog(win, {
    properties: ['openDirectory'],
    defaultPath: store.get('downloadPath'),
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

// -------------------------------------------------------
// IPC — i18n
// -------------------------------------------------------
ipcMain.handle('get-locale', () => store.get('locale', 'en'));

ipcMain.handle('set-locale', (_event, lang) => {
  if (!['en', 'pt-BR'].includes(lang)) return;
  store.set('locale', lang);
  // Rebuild tray with new locale
  rebuildMenu();
  tray?.setToolTip(
    isServerRunning
      ? tr('trayTooltipRunning', { port: store.get('port') })
      : tr('trayTooltipWaiting')
  );
});

ipcMain.handle('get-strings', (_event, loc) => {
  const { strings } = require('./i18n');
  return strings[loc] || strings['en'];
});

// -------------------------------------------------------
// IPC — onboarding
// -------------------------------------------------------
ipcMain.handle('onboarding-done', () => {
  store.set('onboardingDone', true);
  if (onboardingWindow) {
    onboardingWindow.close();
  }
  openSettings();
});

ipcMain.handle('get-server-info', () => ({
  port: store.get('port'),
  localIP: mdns.getLocalIP(),
  isServerRunning,
}));
