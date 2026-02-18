# OpenPaste

Bridge iPhone → Windows para envio de texto, URLs, imagens e arquivos em segundos.

## Como funciona

```
iPhone (Atalhos / Share Sheet)
        │
        │  HTTP POST  (Wi-Fi LAN)
        ▼
Windows (Electron — tray)
  ├── Servidor HTTP :9876
  ├── texto/URL  → clipboard do Windows
  ├── imagem/arquivo → pasta Downloads/OpenPaste
  └── Notificação nativa
```

O PC se anuncia na rede como **`openpaste.local`** via mDNS/Bonjour — sem precisar saber o IP.

---

## Estrutura

```
OpenPaste/
├── electron/
│   ├── main.js          # processo principal: tray, IPC, notificações
│   ├── server.js        # Express + endpoint POST /clip
│   ├── mdns.js          # anúncio Bonjour (openpaste.local)
│   ├── preload.js       # bridge IPC para o renderer
│   ├── renderer/
│   │   ├── index.html   # janela de configurações
│   │   └── settings.js  # lógica da UI
│   ├── assets/
│   │   └── icon.png
│   └── package.json
├── shortcuts/
│   └── README.md        # guia de setup do Atalho iOS
└── README.md
```

---

## Setup

### Windows

```bash
cd electron
npm install
npm start          # desenvolvimento
npm run build      # gera instalador .exe em ../dist/
```

### iPhone

Siga o guia em [`shortcuts/README.md`](shortcuts/README.md) para criar o Atalho iOS.

---

## API do servidor

### `POST /clip`

```json
{
  "type":     "text" | "url" | "image" | "file",
  "content":  "<string ou base64>",
  "filename": "opcional.jpg"
}
```

| Tipo | Comportamento no Windows |
|------|--------------------------|
| `text` | Copia para clipboard |
| `url` | Copia para clipboard |
| `image` | Salva em pasta + notificação |
| `file` | Salva em pasta + notificação |

Limite por transferência: **50 MB**.

### `GET /ping`

```json
{ "ok": true, "name": "OpenPaste", "version": "1.0.0" }
```

---

## Configurações

| Opção | Padrão |
|-------|--------|
| Porta | `9876` |
| Pasta de destino | `~/Downloads/OpenPaste` |
| Iniciar com o Windows | desativado |

---

## Requisitos

- Windows 10/11 (64-bit)
- iPhone com iOS 13+ e app Atalhos
- Mesma rede Wi-Fi

---

## Licença

MIT
