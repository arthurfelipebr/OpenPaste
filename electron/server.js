'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs');
const os = require('os');

const MAX_BYTES = 50 * 1024 * 1024; // 50 MB

// Histórico em memória (somente sessão atual)
const history = [];

function addHistory(entry) {
  history.unshift({ ...entry, at: new Date().toISOString() });
  if (history.length > 200) history.pop();
}

function getHistory() {
  return history;
}

/**
 * Cria e configura o servidor Express.
 * @param {object} deps
 * @param {import('electron-store')} deps.store
 * @param {function} deps.onReceive  Callback chamado após cada recebimento bem-sucedido.
 * @returns {{ app: express.Application, start: function, stop: function }}
 */
function createServer({ store, onReceive }) {
  const app = express();

  // Limite de 50 MB para JSON e raw body
  app.use((req, res, next) => {
    let bytes = 0;
    req.on('data', (chunk) => {
      bytes += chunk.length;
      if (bytes > MAX_BYTES) {
        req.destroy();
        res.status(413).json({ ok: false, error: 'Payload too large (max 50 MB)' });
      }
    });
    next();
  });

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: false, limit: '50mb' }));

  // -------------------------------------------------------
  // POST /clip — payload único para todos os tipos
  // Body esperado:
  //   { type: 'text'|'url'|'image'|'file', content: '<string|base64>', filename?: string }
  // -------------------------------------------------------
  app.post('/clip', async (req, res) => {
    const { type, content, filename } = req.body || {};

    if (!type || content === undefined) {
      return res.status(400).json({ ok: false, error: 'Missing type or content' });
    }

    try {
      if (type === 'text' || type === 'url') {
        await handleText(content);
        addHistory({ type, preview: content.slice(0, 120) });
        onReceive({ type, content, filename: null });
        return res.json({ ok: true });
      }

      if (type === 'image' || type === 'file') {
        const savedPath = await handleFile({ type, content, filename, store });
        addHistory({ type, preview: path.basename(savedPath), filePath: savedPath });
        onReceive({ type, content: null, filename: path.basename(savedPath), filePath: savedPath });
        return res.json({ ok: true, path: savedPath });
      }

      return res.status(400).json({ ok: false, error: `Unknown type: ${type}` });
    } catch (err) {
      console.error('[server] Error handling /clip:', err);
      return res.status(500).json({ ok: false, error: err.message });
    }
  });

  // GET /ping — health check (usado pelo Atalho iOS para testar conectividade)
  app.get('/ping', (_req, res) => {
    res.json({ ok: true, name: 'OpenPaste', version: '1.0.0' });
  });

  // GET /history — usado pela janela de configurações via IPC (não exposto externamente)
  // (O histórico é passado via IPC, não por HTTP — este endpoint é opcional/debug)
  app.get('/history', (_req, res) => {
    res.json(getHistory());
  });

  let httpServer = null;

  function start() {
    const port = store.get('port', 9876);
    return new Promise((resolve, reject) => {
      httpServer = app.listen(port, '0.0.0.0', () => {
        console.log(`[server] Listening on port ${port}`);
        resolve(port);
      });
      httpServer.on('error', reject);
    });
  }

  function stop() {
    return new Promise((resolve) => {
      if (httpServer) {
        httpServer.close(() => {
          console.log('[server] Stopped');
          httpServer = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  return { app, start, stop };
}

// -------------------------------------------------------
// Handlers internos
// -------------------------------------------------------

async function handleText(content) {
  // clipboardy é ESM — import dinâmico necessário
  const { default: clipboard } = await import('clipboardy');
  await clipboard.write(content);
  console.log(`[server] Text/URL copied to clipboard (${content.length} chars)`);
}

async function handleFile({ type, content, filename, store }) {
  const destDir = store.get('downloadPath', getDefaultDownloadPath());

  // Garantir que o diretório existe
  fs.mkdirSync(destDir, { recursive: true });

  // Determinar nome do arquivo
  const ext = guessExtension(type, filename);
  const base = filename
    ? sanitizeFilename(filename)
    : `openpaste_${Date.now()}${ext}`;

  const destPath = uniquePath(destDir, base);

  // Decodificar base64 e salvar
  const buffer = Buffer.from(content, 'base64');
  fs.writeFileSync(destPath, buffer);
  console.log(`[server] File saved: ${destPath} (${buffer.length} bytes)`);

  return destPath;
}

// -------------------------------------------------------
// Utilitários
// -------------------------------------------------------

function getDefaultDownloadPath() {
  return path.join(os.homedir(), 'Downloads', 'OpenPaste');
}

function guessExtension(type, filename) {
  if (filename) {
    const ext = path.extname(filename);
    if (ext) return ext;
  }
  return type === 'image' ? '.png' : '.bin';
}

function sanitizeFilename(name) {
  return name.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');
}

function uniquePath(dir, base) {
  let candidate = path.join(dir, base);
  if (!fs.existsSync(candidate)) return candidate;

  const ext = path.extname(base);
  const stem = base.slice(0, base.length - ext.length);
  let i = 1;
  do {
    candidate = path.join(dir, `${stem}_${i}${ext}`);
    i++;
  } while (fs.existsSync(candidate));

  return candidate;
}

module.exports = { createServer, getHistory, getDefaultDownloadPath };
