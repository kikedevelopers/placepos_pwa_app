import { browser } from '$app/environment'

/**
 * Equivalente web del wrapper de `expo-secure-store` de pos_app. En la PWA el
 * token vive en localStorage. Se mantiene la API async para no cambiar la firma
 * de los interceptores ni del flujo de login. Nunca acceder a localStorage
 * directamente desde fuera de este wrapper.
 */
const TOKEN_KEY = 'placepos_pwa.auth_token'

export const getAuthToken = async (): Promise<string | null> => {
    if (!browser) return null
    return localStorage.getItem(TOKEN_KEY)
}

export const setAuthToken = async (token: string): Promise<void> => {
    if (!browser) return
    localStorage.setItem(TOKEN_KEY, token)
}

export const removeAuthToken = async (): Promise<void> => {
    if (!browser) return
    localStorage.removeItem(TOKEN_KEY)
}
