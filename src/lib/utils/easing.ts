/**
 * Curvas de easing para las transiciones de Svelte (las de `svelte/easing` no
 * traen las curvas fuertes del sistema). Mismas curvas que tailwind.config:
 * `drawer` (cajones/sheets, estilo iOS) y `out-strong` (entradas).
 */

/** Curva cúbica de Bézier (x1, y1, x2, y2) → función de easing t ∈ [0, 1]. */
export const cubicBezier = (x1: number, y1: number, x2: number, y2: number) => {
    const sample = (a: number, b: number, t: number) =>
        3 * a * (1 - t) ** 2 * t + 3 * b * (1 - t) * t ** 2 + t ** 3
    const slope = (a: number, b: number, t: number) =>
        3 * a * (1 - t) ** 2 + 6 * (b - a) * (1 - t) * t + 3 * (1 - b) * t ** 2

    return (x: number): number => {
        if (x <= 0) return 0
        if (x >= 1) return 1
        // Newton-Raphson para hallar t tal que bezierX(t) = x; bisección de respaldo.
        let t = x
        for (let i = 0; i < 8; i += 1) {
            const error = sample(x1, x2, t) - x
            if (Math.abs(error) < 1e-6) return sample(y1, y2, t)
            const d = slope(x1, x2, t)
            if (Math.abs(d) < 1e-6) break
            t -= error / d
        }
        let low = 0
        let high = 1
        t = x
        for (let i = 0; i < 30; i += 1) {
            const value = sample(x1, x2, t)
            if (Math.abs(value - x) < 1e-6) break
            if (value < x) low = t
            else high = t
            t = (low + high) / 2
        }
        return sample(y1, y2, t)
    }
}

/** Cajones y sheets (curva de iOS). */
export const easeDrawer = cubicBezier(0.32, 0.72, 0, 1)
/** Entradas y respuestas rápidas. */
export const easeOutStrong = cubicBezier(0.23, 1, 0.32, 1)
