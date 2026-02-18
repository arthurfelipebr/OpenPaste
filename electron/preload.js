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

  /** Retorna o locale atual ('en' ou 'pt-BR') */
  getLocale: () => ipcRenderer.invoke('get-locale'),

  /** Define o locale; persiste em electron-store */
  setLocale: (lang) => ipcRenderer.invoke('set-locale', lang),

  /** Retorna o catálogo completo de strings para um locale */
  getStrings: (lang) => ipcRenderer.invoke('get-strings', lang),

  /** Retorna info do servidor (port, localIP, isServerRunning) */
  getServerInfo: () => ipcRenderer.invoke('get-server-info'),

  /** Marca onboarding como concluído; abre janela de settings */
  onboardingDone: () => ipcRenderer.invoke('onboarding-done'),

  /** Escuta atualizações de histórico em tempo real */
  onHistoryUpdate: (callback) => {
    ipcRenderer.on('history-update', (_event, history) => callback(history));
  },

  /** Remove listener de atualizações */
  offHistoryUpdate: () => {
    ipcRenderer.removeAllListeners('history-update');
  },
});
