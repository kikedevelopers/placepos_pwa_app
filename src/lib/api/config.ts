import axios, { type AxiosInstance } from 'axios'
import { env } from '$lib/constants/env'
import { getAuthToken } from '$lib/api/storage'
import { handleSessionExpired } from '$lib/api/session'
import { subscriptionBlock } from '$lib/stores/subscriptionBlock.svelte'

let _api: AxiosInstance | null = null

export const getApiInstance = (): AxiosInstance => {
    if (_api) return _api

    // Solo en dev sobre un túnel ngrok: salta la página interstitial de
    // advertencia del navegador. Inofensivo contra un backend real (header
    // desconocido que se ignora), pero solo se envía si la URL es de ngrok.
    const isNgrok = env.apiBaseUrl.includes('ngrok')

    _api = axios.create({
        baseURL: env.apiBaseUrl,
        headers: {
            'Content-Type': 'application/json',
            ...(isNgrok ? { 'ngrok-skip-browser-warning': 'true' } : {})
        },
        timeout: 15000
    })

    _api.interceptors.request.use(async (config) => {
        const token = await getAuthToken()
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    })

    _api.interceptors.response.use(
        (response) => response,
        async (error) => {
            if (!error.response) {
                return Promise.reject({
                    status: 503,
                    error: 'Servidor no disponible. Verifica la conexión.'
                })
            }

            const status = error.response.status as number
            const data = error.response.data
            const payload =
                typeof data === 'object' && data !== null
                    ? { ...(data as Record<string, unknown>) }
                    : { error: String(data ?? '') }

            const requestUrl = (error.config?.url as string | undefined) ?? ''
            const isAuthEndpoint =
                requestUrl.includes('/auth/user') || requestUrl.includes('/auth/check')

            if (status === 401 && !isAuthEndpoint) {
                // Token inválido/expirado en un endpoint protegido: cierra la
                // sesión (token + estado + caché) para que AuthGate redirija a
                // login. Sin esto quedaría una "sesión zombie" en /(app).
                await handleSessionExpired()
            }

            // 402 (cloud): la suscripción venció. Marca el estado global para
            // que el modal bloqueante tape la app; el usuario cierra sesión él.
            if (status === 402) {
                subscriptionBlock.markExpired()
            }

            return Promise.reject({ status, ...payload })
        }
    )

    return _api
}

const api = new Proxy({} as AxiosInstance, {
    get(_target, prop) {
        return (getApiInstance() as unknown as Record<string | symbol, unknown>)[prop]
    }
})

export default api
