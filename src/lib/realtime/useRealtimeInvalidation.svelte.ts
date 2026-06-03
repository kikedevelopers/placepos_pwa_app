import { queryClient } from '$lib/api/queryClient'
import { auth } from '$lib/stores/auth.svelte'
import { env } from '$lib/constants/env'
import { connectRealtime, disconnectRealtime } from './socket'
import { REALTIME_HANDLERS } from './handlers'

const DEFAULT_DEBOUNCE_MS = 300

/**
 * Suscribe la PWA al gateway de tiempo real de pos_api e invalida las queries
 * afectadas cuando llega un evento. Debe llamarse UNA vez desde el layout raíz
 * para que la conexión sobreviva la navegación entre `(app)` y el POS inmersivo
 * `/pos` (rutas hermanas que desmontarían un layout intermedio).
 *
 * Reactivo a `auth.token`: conecta al iniciar sesión / hidratar el token,
 * reconecta si el token cambia (refresh) y desconecta al cerrar sesión.
 * Best-effort: si el socket falla, el polling HTTP de cada query sigue vigente.
 */
export const useRealtimeInvalidation = (): void => {
    $effect(() => {
        const token = auth.token
        if (!token) {
            disconnectRealtime()
            return
        }

        const socket = connectRealtime(env.apiBaseUrl, token)
        const timers: ReturnType<typeof setTimeout>[] = []

        for (const handler of REALTIME_HANDLERS) {
            const debounceMs = handler.debounceMs ?? DEFAULT_DEBOUNCE_MS
            let timer: ReturnType<typeof setTimeout> | null = null

            const invalidate = (): void => {
                for (const key of handler.keys) {
                    void queryClient.invalidateQueries({ queryKey: key })
                }
            }

            socket.on(handler.event, () => {
                if (debounceMs <= 0) {
                    invalidate()
                    return
                }
                if (timer) clearTimeout(timer)
                timer = setTimeout(invalidate, debounceMs)
                timers.push(timer)
            })
        }

        return () => {
            for (const t of timers) clearTimeout(t)
            disconnectRealtime()
        }
    })
}
