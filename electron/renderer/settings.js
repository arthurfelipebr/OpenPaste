'use strict';

// ── Estado ───────────────────────────────────────────────
let currentConfig = {};
let currentLocale = 'en';
let strings = {};

// ── Init ─────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  // Carregar locale e strings primeiro
  currentLocale = await window.openPaste.getLocale();
  strings = await window.openPaste.getStrings(currentLocale);
  applyI18n();
  updateLangButtons();

  await loadConfig();
  await loadHistory();

  // Escutar atualizações em tempo real do main process
  window.openPaste.onHistoryUpdate((history) => {
    renderHistory(history);
  });
});

// ── i18n ─────────────────────────────────────────────────
function t(key, vars) {
  let str = strings[key] || key;
  if (vars) {
    Object.keys(vars).forEach((k) => {
      str = str.replace(`{${k}}`, vars[k]);
    });
  }
  return str;
}

function applyI18n() {
  // Elementos com data-i18n (textContent)
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
  // Elementos com data-i18n-html (innerHTML — para tags <strong> etc)
  document.querySelectorAll('[data-i18n-html]').forEach((el) => {
    const key = el.getAttribute('data-i18n-html');
    el.innerHTML = t(key);
  });
  // Atualizar título da janela
  document.title = t('settingsTitle');
  // Re-aplicar status se já tiver config
  if (currentConfig && Object.keys(currentConfig).length) {
    updateServerStatus(currentConfig.isServerRunning);
    updateHistoryBadge(
      document.getElementById('historyList')?.querySelectorAll('.history-item').length ?? 0
    );
  }
}

async function switchLang(lang) {
  if (lang === currentLocale) return;
  await window.openPaste.setLocale(lang);
  currentLocale = lang;
  strings = await window.openPaste.getStrings(lang);
  applyI18n();
  updateLangButtons();
  // Reload config to re-apply dynamic strings
  if (currentConfig && Object.keys(currentConfig).length) {
    updateServerStatus(currentConfig.isServerRunning);
  }
}

function updateLangButtons() {
  document.getElementById('langEn').classList.toggle('active', currentLocale === 'en');
  document.getElementById('langPt').classList.toggle('active', currentLocale === 'pt-BR');
}

// ── Carregar configuração ────────────────────────────────
async function loadConfig() {
  try {
    const config = await window.openPaste.getConfig();
    currentConfig = config;
    applyConfig(config);
  } catch (err) {
    console.error('[settings] Error loading config:', err);
  }
}

function applyConfig(config) {
  document.getElementById('portInput').value = config.port ?? 9876;
  document.getElementById('downloadPath').value = config.downloadPath ?? '';
  document.getElementById('autoLaunchToggle').checked = config.autoLaunch ?? false;

  updateServerStatus(config.isServerRunning);
  updateNetInfo(config.localIP, config.port);
}

function updateServerStatus(running) {
  const pill   = document.getElementById('statusPill');
  const label  = document.getElementById('statusLabel');
  const btn    = document.getElementById('toggleServerBtn');
  const sub    = document.getElementById('serverSubtitle');

  if (running) {
    pill.classList.remove('offline');
    label.textContent = t('statusRunning');
    btn.textContent   = t('btnStopServer');
    btn.className     = 'btn btn-danger';
    sub.textContent   = t('serverSubRunning', { port: currentConfig.port ?? 9876 });
  } else {
    pill.classList.add('offline');
    label.textContent = t('statusStopped');
    btn.textContent   = t('btnStartServer');
    btn.className     = 'btn btn-ghost';
    sub.textContent   = t('serverSubStopped');
  }
}

function updateNetInfo(ip, port) {
  const ipEl  = document.getElementById('localIP');
  const urlEl = document.getElementById('fullUrl');

  // Preservar o botão de cópia já existente
  const copyIP  = ipEl.querySelector('button');
  const copyURL = urlEl.querySelector('button');

  ipEl.textContent  = ip ?? '—';
  urlEl.textContent = ip ? `http://${ip}:${port}/clip` : '—';

  if (copyIP)  ipEl.appendChild(copyIP);
  if (copyURL) urlEl.appendChild(copyURL);
}

// ── Salvar configuração ──────────────────────────────────
async function saveConfig() {
  const newConfig = {
    port:         parseInt(document.getElementById('portInput').value, 10),
    downloadPath: document.getElementById('downloadPath').value,
    autoLaunch:   document.getElementById('autoLaunchToggle').checked,
  };

  if (!newConfig.port || newConfig.port < 1024 || newConfig.port > 65535) {
    showFeedback(t('feedbackInvalidPort'), true);
    return;
  }

  try {
    await window.openPaste.saveConfig(newConfig);
    currentConfig = { ...currentConfig, ...newConfig };
    updateNetInfo(currentConfig.localIP, newConfig.port);
    showFeedback(t('feedbackSaved'));
    // Reload para refletir estado do servidor após possível restart
    await loadConfig();
  } catch (err) {
    showFeedback(t('feedbackError'), true);
    console.error(err);
  }
}

function showFeedback(msg, isError = false) {
  const el = document.getElementById('saveFeedback');
  el.textContent = msg;
  el.style.color = isError ? 'var(--danger)' : 'var(--accent2)';
  el.classList.add('visible');
  setTimeout(() => el.classList.remove('visible'), 2500);
}

// ── Toggle servidor ──────────────────────────────────────
async function toggleServer() {
  const btn = document.getElementById('toggleServerBtn');
  btn.disabled = true;
  btn.textContent = '…';

  try {
    const result = await window.openPaste.toggleServer();
    currentConfig.isServerRunning = result.isServerRunning;
    updateServerStatus(result.isServerRunning);
  } catch (err) {
    console.error('[settings] Error toggling server:', err);
  } finally {
    btn.disabled = false;
  }
}

// ── Seleção de pasta ─────────────────────────────────────
async function pickFolder() {
  const selected = await window.openPaste.pickFolder();
  if (selected) {
    document.getElementById('downloadPath').value = selected;
  }
}

function openFolder() {
  window.openPaste.openFolder();
}

// ── Histórico ────────────────────────────────────────────
async function loadHistory() {
  try {
    const history = await window.openPaste.getHistory();
    renderHistory(history);
  } catch {
    // silencioso
  }
}

function updateHistoryBadge(count) {
  const badge = document.getElementById('historyCount');
  if (!badge) return;
  const key = count === 1 ? 'historyItems' : 'historyItemsPlural';
  badge.textContent = t(key, { n: count });
}

function renderHistory(history) {
  const list = document.getElementById('historyList');
  updateHistoryBadge(history.length);

  if (!history.length) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <span>${t('historyEmpty')}</span>
      </div>`;
    return;
  }

  list.innerHTML = history.map((item) => {
    const typeClass = `type-${item.type}`;
    const time = formatTime(item.at);
    const preview = escapeHTML(item.preview ?? '');

    return `
      <div class="history-item">
        <span class="type-badge ${typeClass}">${item.type}</span>
        <span class="history-preview" title="${preview}">${preview}</span>
        <span class="history-time">${time}</span>
      </div>`;
  }).join('');
}

// ── Utilitários ───────────────────────────────────────────
function copyValue(elementId) {
  const el = document.getElementById(elementId);
  const text = el.childNodes[0]?.textContent?.trim() ?? el.textContent.trim();
  copyText(text);
}

function copyText(text) {
  if (!text || text === '—') return;
  navigator.clipboard.writeText(text).then(() => {
    showFeedback(t('feedbackCopied'));
  }).catch(() => {});
}

function formatTime(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  const loc = currentLocale === 'pt-BR' ? 'pt-BR' : 'en-US';
  return d.toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function escapeHTML(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
