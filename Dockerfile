# =============================================================================
# PlacePOS PWA - Dockerfile multi-stage (despliegue).
#
# Construye el SPA (SvelteKit adapter-static) y lo sirve con nginx. La imagen
# final ES un nginx que sirve los archivos estaticos + termina TLS (Let's
# Encrypt via certbot, montado por docker-compose.prod.yml).
#
# El frontend habla con pos_api DIRECTO desde el navegador (CORS), por eso el
# nginx de la PWA NO hace reverse-proxy: solo sirve estaticos. La URL del API
# se hornea en build-time (adapter-static) via el build-arg PUBLIC_API_URL.
# =============================================================================

# ---------- Stage 1: dependencias ----------
FROM node:20-alpine AS deps

RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod=false


# ---------- Stage 2: build (SvelteKit -> build/ estatico) ----------
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# URL del backend pos_api en produccion. adapter-static hornea las PUBLIC_*
# en el bundle del cliente al construir, por eso DEBE estar presente AQUI.
# El workflow de CI la pasa con --build-arg desde una variable del repo.
ARG PUBLIC_API_URL=https://foxpos.kikedevs.com
ENV PUBLIC_API_URL=${PUBLIC_API_URL}

RUN pnpm build


# ---------- Stage 3: runner (nginx sirviendo el SPA) ----------
FROM nginx:1.27-alpine AS runner

# wget para el healthcheck.
RUN apk add --no-cache wget

# SPA estatico al docroot de nginx.
COPY --from=builder /app/build /usr/share/nginx/html

# Template del vhost: la imagen oficial de nginx corre envsubst sobre
# /etc/nginx/templates/*.template al arrancar (solo las vars listadas en
# NGINX_ENVSUBST_TEMPLATE_VARS) y escribe el resultado en /etc/nginx/conf.d/.
COPY nginx/conf.d/default.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 80 443

# Healthcheck: el endpoint plano /nginx-health del vhost (no requiere TLS).
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD sh -c 'wget --quiet --tries=1 --spider "http://localhost:80/nginx-health" || exit 1'
