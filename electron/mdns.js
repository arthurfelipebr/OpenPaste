'use strict';

const os = require('os');

let bonjourInstance = null;
let publishedService = null;

/**
 * Anuncia o serviço OpenPaste na rede local via mDNS/Bonjour.
 * O iPhone pode acessar via http://openpaste.local:<port>/clip
 *
 * @param {number} port  Porta onde o servidor HTTP está escutando.
 * @returns {Promise<void>}
 */
async function advertise(port) {
  try {
    const { Bonjour } = require('bonjour-service');

    if (bonjourInstance) {
      await stop();
    }

    bonjourInstance = new Bonjour();

    publishedService = bonjourInstance.publish({
      name: 'OpenPaste',
      type: 'http',
      port: port,
      txt: {
        version: '1.0.0',
        platform: os.platform(),
      },
    });

    publishedService.on('up', () => {
      console.log(`[mdns] Anunciando openpaste.local:${port} via mDNS/Bonjour`);
    });

    publishedService.on('error', (err) => {
      console.warn('[mdns] Erro ao anunciar serviço:', err.message);
    });
  } catch (err) {
    // mDNS não é crítico — falha silenciosa com aviso
    console.warn('[mdns] Bonjour não disponível nesta máquina:', err.message);
    console.warn('[mdns] O iPhone precisará usar o IP local diretamente.');
  }
}

/**
 * Para o anúncio mDNS e destrói a instância Bonjour.
 * @returns {Promise<void>}
 */
async function stop() {
  return new Promise((resolve) => {
    if (!bonjourInstance) {
      resolve();
      return;
    }

    try {
      bonjourInstance.unpublishAll(() => {
        bonjourInstance.destroy();
        bonjourInstance = null;
        publishedService = null;
        console.log('[mdns] Serviço encerrado');
        resolve();
      });
    } catch {
      bonjourInstance = null;
      publishedService = null;
      resolve();
    }
  });
}

/**
 * Retorna o endereço IPv4 local da máquina (para exibir nas configurações).
 * @returns {string|null}
 */
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  const entries = [];

  for (const [name, iface] of Object.entries(interfaces)) {
    if (!Array.isArray(iface)) continue;
    for (const alias of iface) {
      if (!alias || alias.family !== 'IPv4' || alias.internal) continue;
      entries.push({
        name,
        address: alias.address,
      });
    }
  }

  if (!entries.length) return null;

  const isPrivateIPv4 = (ip) => {
    const p = ip.split('.').map((n) => Number(n));
    if (p.length !== 4 || p.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return false;
    return (
      p[0] === 10 ||
      (p[0] === 172 && p[1] >= 16 && p[1] <= 31) ||
      (p[0] === 192 && p[1] === 168)
    );
  };

  const lanCandidates = entries.filter((e) => isPrivateIPv4(e.address));
  if (!lanCandidates.length) return null;

  // Em Windows, priorizar adaptadores comuns de rede local.
  const preferred = lanCandidates.find((e) => /(wi-?fi|wlan|wireless|ethernet|^eth|lan)/i.test(e.name));
  if (preferred) return preferred.address;

  return lanCandidates[0].address;
}

module.exports = { advertise, stop, getLocalIP };
