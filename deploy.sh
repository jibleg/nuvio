#!/usr/bin/env bash
#
# Deploy de Nuvio a producción (Next.js server + PM2 + nginx en el VPS).
# Uso:  ./deploy.sh
#
# Requiere: alias SSH "proyectosolmeca" configurado y acceso al VPS.
set -euo pipefail

# ---- Config ----
SSH_HOST="${NUVIO_SSH_HOST:-proyectosolmeca}"
REMOTE_DIR="${NUVIO_REMOTE_DIR:-/opt/nuvio}"
PM2_APP="${NUVIO_PM2_APP:-nuvio}"
URL="${NUVIO_URL:-https://nuvio.proyectosolmeca.com}"

cyan() { printf "\033[36m%s\033[0m\n" "$1"; }
green() { printf "\033[32m%s\033[0m\n" "$1"; }
red() { printf "\033[31m%s\033[0m\n" "$1"; }

cd "$(dirname "$0")"

cyan "▸ 1/3  Subiendo código fuente a ${SSH_HOST}:${REMOTE_DIR} ..."
rsync -az --delete \
  --exclude node_modules --exclude .next --exclude out --exclude .git \
  --exclude assets --exclude '.DS_Store' --exclude '*.log' --exclude '.env*' \
  -e "ssh -o ConnectTimeout=20" \
  ./ "${SSH_HOST}:${REMOTE_DIR}/"

cyan "▸ 2/3  Instalando, compilando y reiniciando en el servidor ..."
ssh "$SSH_HOST" REMOTE_DIR="$REMOTE_DIR" PM2_APP="$PM2_APP" 'bash -s' <<'REMOTE'
set -euo pipefail
export NVM_DIR=/root/.nvm
# shellcheck disable=SC1091
. "$NVM_DIR/nvm.sh" >/dev/null 2>&1
cd "$REMOTE_DIR"
npm ci --no-audit --no-fund
npm run build
# Ensamblar el bundle standalone (Next no copia static/public automáticamente)
rm -rf .next/standalone/.next/static .next/standalone/public
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public
# Reiniciar (o arrancar desde el ecosystem si aún no existe el proceso)
if pm2 describe "$PM2_APP" >/dev/null 2>&1; then
  pm2 restart "$PM2_APP" --update-env
else
  pm2 start ecosystem.config.cjs
fi
pm2 save >/dev/null 2>&1
REMOTE

cyan "▸ 3/3  Verificando ${URL} ..."
sleep 2
code=$(curl -sS -o /dev/null -w "%{http_code}" "$URL/" || echo "000")
if [ "$code" = "200" ]; then
  green "✔ Deploy OK — ${URL} responde ${code}"
else
  red "✗ ${URL} respondió ${code} (revisa: ssh ${SSH_HOST} 'pm2 logs ${PM2_APP} --lines 40')"
  exit 1
fi
