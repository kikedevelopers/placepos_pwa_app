#!/bin/bash
# =============================================================================
# PlacePOS PWA - deploy de un solo comando.
#
# Idempotente: la primera vez bootstrapea TLS con Let's Encrypt y arranca el
# stack; en runs siguientes solo pullea la imagen nueva y la sube con
# `docker compose up -d`.
#
# Uso en la VM:
#   cd /opt/placepos_pwa_app
#   ./deploy.sh
#
# Variables opcionales:
#   GHCR_USERNAME, GHCR_TOKEN   Para `docker login ghcr.io` (imagen privada).
#   SKIP_LOGIN=1                Salta el login.
#   FORCE_BOOTSTRAP=1           Reemite TLS aunque existan certs.
# =============================================================================
set -euo pipefail

cd "$(dirname "$0")"

COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env"
COMPOSE="docker compose -f $COMPOSE_FILE"

# --- 1. Validaciones ------------------------------------------------------

if ! command -v docker >/dev/null 2>&1; then
  echo "Error: docker no está instalado en esta VM." >&2
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: falta $ENV_FILE en $(pwd)." >&2
  echo "       Copia .env.production.example a .env y ajústalo." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091
. ./"$ENV_FILE"
set +a

: "${DOMAIN:?Falta DOMAIN en .env}"
: "${LETSENCRYPT_EMAIL:?Falta LETSENCRYPT_EMAIL en .env}"
: "${IMAGE_NAME:?Falta IMAGE_NAME en .env (ej: ghcr.io/owner/placepos_pwa_app:latest)}"

# --- 2. Login al registry --------------------------------------------------

if [ "${SKIP_LOGIN:-0}" != "1" ] && [ -n "${GHCR_USERNAME:-}" ] && [ -n "${GHCR_TOKEN:-}" ]; then
  echo "[deploy] docker login ghcr.io como $GHCR_USERNAME ..."
  echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USERNAME" --password-stdin
fi

# --- 3. Pull de la imagen --------------------------------------------------

echo "[deploy] Pulleando $IMAGE_NAME ..."
docker pull "$IMAGE_NAME"

# --- 4. Bootstrap TLS si es primera vez ------------------------------------

CERTS_PATH="./certbot/conf/live/$DOMAIN"
if [ "${FORCE_BOOTSTRAP:-0}" = "1" ] || [ ! -d "$CERTS_PATH" ]; then
  echo "[deploy] No hay certificados Let's Encrypt para $DOMAIN — bootstrap inicial."
  bash ./init-letsencrypt.sh
fi

# --- 5. Arranque del stack -------------------------------------------------

echo "[deploy] Levantando stack..."
$COMPOSE up -d --remove-orphans

# --- 6. Reporte ------------------------------------------------------------

echo
echo "[deploy] Estado de los servicios:"
$COMPOSE ps

echo
echo "[deploy] Verificando health del web (esperando hasta 60s)..."
for i in $(seq 1 60); do
  status=$(docker inspect -f '{{.State.Health.Status}}' placepos_pwa_web 2>/dev/null || echo "missing")
  case "$status" in
    healthy)
      echo "[deploy] web healthy (Docker healthcheck OK)."
      break
      ;;
    unhealthy)
      echo "[deploy] web marcado unhealthy. Revisa: $COMPOSE logs web" >&2
      exit 1
      ;;
    missing)
      echo "[deploy] Contenedor placepos_pwa_web no existe — algo voló durante el up." >&2
      exit 1
      ;;
  esac
  sleep 1
  if [ "$i" -eq 60 ]; then
    echo "[deploy] El web seguía en '$status' tras 60s. Revisa: $COMPOSE logs web" >&2
    exit 1
  fi
done

echo
echo "[deploy] Deploy completo:"
echo "         https://$DOMAIN"
