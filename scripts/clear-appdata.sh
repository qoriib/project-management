#!/usr/bin/env bash
# =============================================================
# clear-appdata.sh — Hapus data aplikasi Manajemen Proyek (macOS)
# Tauri app identifier : com.laman.project
# Product name         : Manajemen Proyek
# =============================================================

set -euo pipefail

APP_IDENTIFIER="com.laman.project"
APP_NAME="Manajemen Proyek"

# Warna terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}======================================${NC}"
echo -e "${CYAN}  Hapus App Data — ${APP_NAME}${NC}"
echo -e "${CYAN}======================================${NC}"
echo ""

# Daftar direktori yang akan dihapus
PATHS=(
  "$HOME/Library/Application Support/${APP_IDENTIFIER}"
  "$HOME/Library/Application Support/${APP_NAME}"
  "$HOME/Library/Caches/${APP_IDENTIFIER}"
  "$HOME/Library/Caches/${APP_NAME}"
  "$HOME/Library/WebKit/${APP_IDENTIFIER}"
  "$HOME/Library/WebKit/${APP_NAME}"
  "$HOME/Library/Logs/${APP_IDENTIFIER}"
  "$HOME/Library/Logs/${APP_NAME}"
  "$HOME/Library/Saved Application State/${APP_IDENTIFIER}.savedState"
)

FOUND=0

for DIR in "${PATHS[@]}"; do
  if [ -e "$DIR" ]; then
    FOUND=1
    echo -e "${YELLOW}Ditemukan:${NC} $DIR"
  fi
done

if [ "$FOUND" -eq 0 ]; then
  echo -e "${GREEN}Tidak ada data aplikasi yang ditemukan.${NC}"
  exit 0
fi

echo ""
read -rp "$(echo -e "${RED}Hapus semua direktori di atas? (y/N): ${NC}")" CONFIRM

if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
  echo -e "${YELLOW}Dibatalkan.${NC}"
  exit 0
fi

echo ""

for DIR in "${PATHS[@]}"; do
  if [ -e "$DIR" ]; then
    rm -rf "$DIR"
    echo -e "${GREEN}✓ Dihapus:${NC} $DIR"
  fi
done

echo ""
echo -e "${GREEN}✅ Selesai! Semua data aplikasi telah dihapus.${NC}"
