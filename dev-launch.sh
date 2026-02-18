#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# OpenPaste — dev-launch.sh
# Sincroniza os fontes do WSL → Windows e lança o Electron
# nativamente no Windows (sem precisar de Node no WSL).
#
# Uso: ./dev-launch.sh [--no-sync]
# ─────────────────────────────────────────────────────────────
set -euo pipefail

# ── Caminhos ──────────────────────────────────────────────────
WSL_SRC="$(cd "$(dirname "$0")/electron" && pwd)"  # fonte no WSL
WIN_DEST="/mnt/c/Users/arthu/clipBuddy/electron"   # destino Windows

# ── Flags ─────────────────────────────────────────────────────
SYNC=true
for arg in "$@"; do
  [[ "$arg" == "--no-sync" ]] && SYNC=false
done

# ── Cores ─────────────────────────────────────────────────────
C_RESET='\033[0m'
C_BOLD='\033[1m'
C_GREEN='\033[0;32m'
C_CYAN='\033[0;36m'
C_YELLOW='\033[0;33m'
C_RED='\033[0;31m'

info()    { echo -e "${C_CYAN}[OpenPaste]${C_RESET} $*"; }
success() { echo -e "${C_GREEN}[OpenPaste]${C_RESET} $*"; }
warn()    { echo -e "${C_YELLOW}[OpenPaste]${C_RESET} $*"; }
error()   { echo -e "${C_RED}[OpenPaste]${C_RESET} $*" >&2; exit 1; }

# ── Verificar que o Windows é acessível ───────────────────────
if [[ ! -d "/mnt/c/Users/arthu" ]]; then
  error "Caminho Windows não encontrado: /mnt/c/Users/arthu\nEdite WIN_DEST neste script."
fi

# ── Sincronizar fontes (excluindo node_modules e dist) ────────
if [[ "$SYNC" == true ]]; then
  info "Sincronizando fontes WSL → Windows..."
  mkdir -p "$WIN_DEST"

  rsync -a --delete \
    --exclude='node_modules/' \
    --exclude='dist/' \
    --exclude='.cache/' \
    "$WSL_SRC/" "$WIN_DEST/"

  success "Sync concluído: $WIN_DEST"
else
  warn "--no-sync: pulando sincronização"
fi

# ── Verificar/instalar dependências no Windows ─────────────────
WIN_DEST_WIN=$(wslpath -w "$WIN_DEST")
WIN_NM="$WIN_DEST/node_modules"

if [[ ! -d "$WIN_NM" ]] || [[ "$WSL_SRC/package.json" -nt "$WIN_NM/.package-sync-stamp" ]]; then
  info "Instalando dependências no Windows (npm install)..."
  powershell.exe -NoProfile -Command "
    Set-Location '${WIN_DEST_WIN}'
    npm install
    if (\$LASTEXITCODE -ne 0) { exit \$LASTEXITCODE }
  "
  # Atualizar stamp de sincronização
  touch "$WIN_NM/.package-sync-stamp"
  success "Dependências instaladas"
else
  info "node_modules já atualizado, pulando npm install"
fi

# ── Lançar Electron no Windows ────────────────────────────────
info "Lançando OpenPaste no Windows..."
powershell.exe -NoProfile -Command "
  Set-Location '${WIN_DEST_WIN}'
  npx electron .
"
