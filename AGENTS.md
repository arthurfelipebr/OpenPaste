# AGENTS.md — OpenPaste

Guidelines for AI coding agents (OpenCode, Copilot, etc.) working on this repository.

## Project overview

**OpenPaste** is a Windows Electron tray app that bridges iPhone → Windows over a local Wi-Fi network.  
Users send text, URLs, images and files from an iOS Shortcut to the Windows app with two taps.  
No cloud relay, no authentication, no accounts — just LAN.

**Repo:** https://github.com/arthurfelipebr/OpenPaste  
**Landing page:** https://arthurfelipebr.github.io/OpenPaste/  
**License:** GNU GPL v3

## Directory layout

```
clipBuddy/                          ← WSL source root (git repo root)
├── AGENTS.md                       ← this file
├── LICENSE                         ← GNU GPL v3
├── README.md
├── .gitignore
├── dev-launch.sh                   ← WSL→Windows rsync + Electron launch
├── electron/
│   ├── package.json                ← Electron app manifest (name: openpaste)
│   ├── main.js                     ← Main process: tray, windows, IPC, server
│   ├── server.js                   ← Express HTTP server (POST /clip, GET /ping)
│   ├── mdns.js                     ← Bonjour/mDNS advertisement (openpaste.local)
│   ├── preload.js                  ← contextBridge → window.openPaste API
│   ├── i18n.js                     ← EN + PT-BR string catalogue
│   ├── renderer/
│   │   ├── index.html              ← Settings window (dark theme)
│   │   ├── settings.js             ← Settings window renderer script
│   │   └── onboarding/
│   │       ├── index.html          ← First-run onboarding wizard
│   │       └── onboarding.js       ← Onboarding renderer script
│   └── assets/
│       ├── icon.png
│       └── icon.svg
├── shortcuts/
│   └── README.md                   ← iOS Shortcut setup guide
└── landing-page/
    ├── index.html                  ← GitHub Pages landing page
    ├── css/
    │   └── style.css
    └── js/
        └── app.js
```

## Key architectural decisions

| Concern | Decision |
|---|---|
| Transport | Wi-Fi LAN only (no cloud relay) |
| Auth | None |
| mDNS hostname | `openpaste.local` |
| Payload limit | 50 MB |
| History | In-memory only (current session) |
| Electron store | `electron-store` v8 (last CJS-compatible version; v10+ is ESM-only) |
| Clipboard | `clipboardy` v4 imported with dynamic `await import('clipboardy')` |
| i18n | `electron/i18n.js` — plain `{ en, 'pt-BR' }` object; locale stored in `electron-store` |
| First launch | Onboarding window shown if `store.get('onboardingDone')` is falsy |
| Subsequent launches | Settings window opens directly (visible), tray always present |

## Dev workflow (WSL → Windows)

Electron cannot run inside WSL. The `dev-launch.sh` script:

1. `rsync`s the `electron/` directory to `C:\Users\arthu\clipBuddy\electron\`
2. Runs `npm install` on the Windows side via `powershell.exe`
3. Launches Electron via `powershell.exe`

```bash
# From /home/arthur/clipBuddy/ in WSL:
bash dev-launch.sh
```

Windows path: `C:\Users\arthu\clipBuddy\electron\`  
WSL mount: `/mnt/c/Users/arthu/clipBuddy/electron/`

## IPC surface (preload.js → main.js)

All methods are async and exposed as `window.openPaste.*`:

| Method | Direction | Purpose |
|---|---|---|
| `getConfig()` | renderer → main | Returns port, downloadPath, autoLaunch, localIP, isServerRunning |
| `saveConfig(cfg)` | renderer → main | Persists settings; restarts server if port changed |
| `getHistory()` | renderer → main | Returns in-memory clip history |
| `toggleServer()` | renderer → main | Start/stop HTTP server |
| `openFolder()` | renderer → main | Opens download folder in Explorer |
| `pickFolder()` | renderer → main | Shows native folder picker dialog |
| `getLocale()` | renderer → main | Returns current locale string (`'en'` or `'pt-BR'`) |
| `setLocale(lang)` | renderer → main | Persists locale; renderer re-applies strings |
| `onboardingDone()` | renderer → main | Marks onboarding complete; opens settings window |
| `onHistoryUpdate(cb)` | main → renderer | Push notification on new clip received |

## i18n conventions

- All user-visible strings live in `electron/i18n.js`.
- HTML elements that need translation carry a `data-i18n="key"` attribute.
- The renderer calls `window.openPaste.getLocale()` on load, then calls `applyI18n(locale)`.
- `applyI18n` iterates `[data-i18n]` elements and sets `textContent` from the catalogue.
- Placeholders (e.g. port number) use `data-i18n-tpl` + string interpolation in JS.

## Coding standards

- **CommonJS only** (`require` / `module.exports`) — no ESM `import` in source files.
  - Exception: `clipboardy` v4 must be loaded with `await import('clipboardy')`.
- No TypeScript — plain JS with `'use strict'`.
- No build step for the renderer — vanilla HTML/CSS/JS loaded directly by Electron.
- Keep `node_modules/` and `dist/` out of git (covered by `.gitignore`).
- `npm audit` warnings in devDependencies (`electron-builder`) can be ignored — they do not affect the runtime.

## Do not

- Add cloud relay, user accounts, or telemetry.
- Upgrade `electron-store` beyond v8.
- Use ESM `import` at the top level in main-process files.
- Commit `node_modules/`, `dist/`, or `.env` files.
- Change the mDNS service name away from `openpaste`.
