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
 * @returns {string}
 */
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const iface of Object.values(interfaces)) {
    for (const alias of iface) {
      if (alias.family === 'IPv4' && !alias.internal) {
        return alias.address;
      }
    }
  }
  return '127.0.0.1';
}

module.exports = { advertise, stop, getLocalIP };
