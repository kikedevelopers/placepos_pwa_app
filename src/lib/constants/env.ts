import { env as publicEnv } from '$env/dynamic/public'

type EnvConfig = {
    apiBaseUrl: string
}

/**
 * URL base del backend (pos_api). En SvelteKit las variables públicas se
 * exponen al cliente con prefijo `PUBLIC_`. Orden de precedencia:
 *   1. `PUBLIC_API_URL` (.env) — túnel ngrok en dev, URL real en prod.
 *   2. `http://localhost:3010` — último recurso (pos_api local).
 */
export const env: EnvConfig = {
    apiBaseUrl: publicEnv.PUBLIC_API_URL ?? 'http://localhost:3010'
}
