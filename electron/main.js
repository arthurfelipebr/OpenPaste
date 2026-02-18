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
let tray = null;
let settingsWindow = null;
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

  store = new Store({
    defaults: {
      port: 9876,
      downloadPath: path.join(os.homedir(), 'Downloads', 'OpenPaste'),
      autoLaunch: false,
    },
  });

  autoLaunch = new AutoLaunch({ name: 'OpenPaste', isHidden: true });

  // Módulos do projeto
  server = require('./server');
  mdns = require('./mdns');

  setupTray();
  await startServer();
});

// Segunda instância → focar janela de settings se aberta
app.on('second-instance', () => {
  if (settingsWindow) {
    if (settingsWindow.isMinimized()) settingsWindow.restore();
    settingsWindow.focus();
  }
});

// Manter o app rodando mesmo sem janelas abertas
app.on('window-all-closed', (e) => e.preventDefault());

// -------------------------------------------------------
// Tray
// -------------------------------------------------------
function setupTray() {
  const iconPath = path.join(__dirname, 'assets', 'icon.png');
  const icon = nativeImage.createFromPath(iconPath);

  tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon);
  tray.setToolTip('OpenPaste — aguardando do iPhone…');
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
      label: isServerRunning ? '● Rodando' : '○ Parado',
      enabled: false,
    },
    {
      label: isServerRunning ? 'Parar servidor' : 'Iniciar servidor',
      click: () => (isServerRunning ? stopServer() : startServer()),
    },
    { type: 'separator' },
    {
      label: 'Configurações…',
      click: openSettings,
    },
    {
      label: 'Abrir pasta de downloads',
      click: () => {
        const dir = store.get('downloadPath');
        fs.mkdirSync(dir, { recursive: true });
        shell.openPath(dir);
      },
    },
    { type: 'separator' },
    {
      label: 'Sair',
      click: async () => {
        await stopServer();
        app.exit(0);
      },
    },
  ]);

  tray.setContextMenu(menu);
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
    title: 'OpenPaste — Configurações',
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
    tray?.setToolTip(`OpenPaste — escutando :${port}`);
    rebuildMenu();

    console.log(`[main] Servidor iniciado na porta ${port}`);
  } catch (err) {
    console.error('[main] Falha ao iniciar servidor:', err);
    notify('OpenPaste — Erro', `Não foi possível iniciar o servidor: ${err.message}`);
  }
}

async function stopServer() {
  if (!isServerRunning) return;

  try {
    await serverInstance.get()?.stop();
    await mdns.stop();
    isServerRunning = false;
    tray?.setToolTip('OpenPaste — parado');
    rebuildMenu();
    console.log('[main] Servidor parado');
  } catch (err) {
    console.error('[main] Erro ao parar servidor:', err);
  }
}

// -------------------------------------------------------
// Handler de payload recebido
// -------------------------------------------------------
function handlePayload({ type, content, filename, filePath }) {
  if (type === 'text' || type === 'url') {
    notify(
      'OpenPaste — Copiado!',
      content.length > 80 ? content.slice(0, 80) + '…' : content
    );
  } else {
    const notif = notify(
      `OpenPaste — ${type === 'image' ? 'Imagem' : 'Arquivo'} recebido`,
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
  const result = await dialog.showOpenDialog(settingsWindow, {
    properties: ['openDirectory'],
    title: 'Escolher pasta de downloads',
    defaultPath: store.get('downloadPath'),
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});
