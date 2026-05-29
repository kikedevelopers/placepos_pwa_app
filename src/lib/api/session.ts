import { queryClient } from '$lib/api/queryClient'
import { removeAuthToken } from '$lib/api/storage'
import { auth } from '$lib/stores/auth.svelte'

/**
 * Cierre de sesión centralizado: limpia el token persistido (localStorage), el
 * estado en memoria (que dispara la redirección de AuthGate) y la caché de
 * svelte-query (para no dejar datos del usuario anterior). Lo usan tanto el
 * interceptor 401 como el logout manual, evitando duplicar la lógica.
 */
export const handleSessionExpired = async (): Promise<void> => {
    await removeAuthToken()
    auth.reset()
    queryClient.clear()
}
