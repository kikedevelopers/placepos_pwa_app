import { browser } from '$app/environment'

export type ThemeMode = 'light' | 'dark'

const STORAGE_KEY = 'placepos_pwa.theme'

/**
 * Preferencia de tema (equivalente al `useThemeStore` de pos_app). Aplica la
 * clase `dark` en <html> y la persiste. Por ahora la app usa colores claros;
 * el modo oscuro queda listo para activarse de forma global.
 */
class ThemeStore {
    mode = $state<ThemeMode>('light')

    setMode(mode: ThemeMode) {
        this.mode = mode
        if (!browser) return
        localStorage.setItem(STORAGE_KEY, mode)
        document.documentElement.classList.toggle('dark', mode === 'dark')
    }

    hydrate() {
        if (!browser) return
        const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null
        if (stored) this.setMode(stored)
    }
}

export const theme = new ThemeStore()
