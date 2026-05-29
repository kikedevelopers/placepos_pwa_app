import type { AuthUser } from '$lib/api/requests/authentication/types'

/**
 * Estado de autenticación (equivalente al `useAuthStore` de zustand en pos_app).
 * En Svelte 5 se modela con runes: leer `auth.token` en un componente es
 * reactivo; desde código imperativo (interceptores, session) se lee/escribe
 * igual. `isHydrated` evita parpadeos hasta que se resuelve el token guardado.
 */
class AuthStore {
    token = $state<string | null>(null)
    user = $state<AuthUser | null>(null)
    isHydrated = $state(false)

    setToken(token: string | null) {
        this.token = token
    }

    setUser(user: AuthUser | null) {
        this.user = user
    }

    setHydrated(hydrated: boolean) {
        this.isHydrated = hydrated
    }

    reset() {
        this.token = null
        this.user = null
    }
}

export const auth = new AuthStore()
