'use strict';

const { contextBridge, ipcRenderer } = require('electron');

/**
 * API exposta ao renderer via window.openPaste
 * Todos os métodos são async e retornam Promises.
 */
contextBridge.exposeInMainWorld('openPaste', {
  /** Retorna a configuração atual */
  getConfig: () => ipcRenderer.invoke('get-config'),

  /** Retorna o histórico da sessão */
  getHistory: () => ipcRenderer.invoke('get-history'),

  /** Salva configurações */
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),

  /** Liga/desliga o servidor HTTP */
  toggleServer: () => ipcRenderer.invoke('toggle-server'),

  /** Abre a pasta de downloads no Explorer */
  openFolder: () => ipcRenderer.invoke('open-folder'),

  /** Abre dialog para escolher pasta; retorna o caminho ou null */
  pickFolder: () => ipcRenderer.invoke('pick-folder'),

  /** Escuta atualizações de histórico em tempo real */
  onHistoryUpdate: (callback) => {
    ipcRenderer.on('history-update', (_event, history) => callback(history));
  },

  /** Remove listener de atualizações */
  offHistoryUpdate: () => {
    ipcRenderer.removeAllListeners('history-update');
  },
});
