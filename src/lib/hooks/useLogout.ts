import { goto } from '$app/navigation'
import { handleSessionExpired } from '$lib/api/session'
import { pushStore } from '$lib/push/pushStore.svelte'

export const useLogout = () => {
    return async () => {
        // Antes de borrar el token: este dispositivo deja de recibir los avisos.
        await pushStore.detach()
        await handleSessionExpired()
        goto('/login', { replaceState: true })
    }
}
