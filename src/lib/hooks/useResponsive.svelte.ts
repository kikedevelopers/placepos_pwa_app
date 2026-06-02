import { browser } from '$app/environment'

const TABLET_BREAKPOINT = 768

/**
 * Versión runes de `useResponsive` de pos_app. Breakpoints simples para layout
 * adaptativo (tablet vs móvil). `contentMaxWidth` sirve para centrar el contenido
 * en pantallas anchas y que no se estire. Escucha el evento `resize` bajo guard de
 * `browser` y limpia el listener al destruir el componente. Debe llamarse durante
 * la inicialización de un componente (usa `$effect`).
 */
export const useResponsive = () => {
    let width = $state(browser ? window.innerWidth : 0)

    $effect(() => {
        if (!browser) return
        const onResize = () => {
            width = window.innerWidth
        }
        // Sincroniza por si cambió entre la inicialización y el montaje.
        onResize()
        window.addEventListener('resize', onResize)
        return () => window.removeEventListener('resize', onResize)
    })

    return {
        get width(): number {
            return width
        },
        get isTablet(): boolean {
            return width >= TABLET_BREAKPOINT
        },
        get columns(): number {
            return width >= TABLET_BREAKPOINT ? 2 : 1
        },
        get contentMaxWidth(): number | undefined {
            return width >= TABLET_BREAKPOINT ? 720 : undefined
        }
    }
}
