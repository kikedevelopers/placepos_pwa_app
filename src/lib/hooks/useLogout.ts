import { goto } from '$app/navigation'
import { handleSessionExpired } from '$lib/api/session'

export const useLogout = () => {
    return async () => {
        await handleSessionExpired()
        goto('/login', { replaceState: true })
    }
}
