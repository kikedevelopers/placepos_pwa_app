// Color de la barra de estado del móvil, compartido por TODA la app.
//
// iOS 26 pinta su propia franja detrás del reloj con el color que toma de la
// página (mira un punto 4px bajo el borde superior y solo considera elementos
// `position: fixed/sticky` que ocupen ≥90% del ancho, leyendo su
// `background-color`, no degradados) y elige el color de la hora por
// contraste. Con este azul profundo el texto blanco contrasta más que el negro
// (ver `prefersLightStatusText`), así que la hora sale en BLANCO. En Android,
// `theme-color` (app.html y el manifest) pinta la barra del mismo azul.
//
// Cambiar este valor exige cambiar también `theme-color` en app.html y
// `theme_color` en vite.config.ts (lo verifica statusBar.test.ts).
export const STATUS_BAR_COLOR = '#1867d8'

// Header del inicio: la mitad superior es PLANA en el color de la barra (así
// la franja del sistema y el header son una sola superficie, sin costura) y
// solo se oscurece hacia abajo, donde la hoja de contenido lo tapa.
export const HEADER_GRADIENT = `linear-gradient(180deg, ${STATUS_BAR_COLOR} 0%, ${STATUS_BAR_COLOR} 45%, #1457c2 100%)`

// El header es `sticky top-0` con el azul como COLOR sólido y el degradado
// encima como imagen: iOS 26 toma exactamente este tono para la franja.
export const HEADER_BACKGROUND_STYLE = `background-color:${STATUS_BAR_COLOR};background-image:${HEADER_GRADIENT}`

/** Luminancia relativa WCAG de un color `#rrggbb` (0 = negro, 1 = blanco). */
export function relativeLuminance(hex: string): number {
    const match = /^#([0-9a-f]{6})$/i.exec(hex.trim())
    if (!match) throw new Error(`Color inválido: ${hex}`)
    const [r, g, b] = [0, 2, 4].map((i) => {
        const c = parseInt(match[1].slice(i, i + 2), 16) / 255
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * ¿El texto BLANCO contrasta más que el negro sobre este fondo? Es la regla con
 * la que el sistema decide el color de la hora sobre la franja que pinta.
 */
export function prefersLightStatusText(hex: string): boolean {
    const l = relativeLuminance(hex)
    const vsWhite = 1.05 / (l + 0.05)
    const vsBlack = (l + 0.05) / 0.05
    return vsWhite > vsBlack
}
