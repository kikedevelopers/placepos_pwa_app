import { describe, expect, it } from 'vitest'
import { cubicBezier, easeDrawer, easeOutStrong } from './easing'

describe('cubicBezier', () => {
    it('empieza en 0 y termina en 1', () => {
        for (const ease of [easeDrawer, easeOutStrong]) {
            expect(ease(0)).toBe(0)
            expect(ease(1)).toBe(1)
            expect(ease(-1)).toBe(0)
            expect(ease(2)).toBe(1)
        }
    })

    it('la curva lineal es la identidad', () => {
        const linear = cubicBezier(0, 0, 1, 1)
        for (const x of [0.1, 0.25, 0.5, 0.9]) expect(linear(x)).toBeCloseTo(x, 4)
    })

    it('las curvas fuertes arrancan rápido (ease-out) y son monótonas', () => {
        expect(easeOutStrong(0.2)).toBeGreaterThan(0.5)
        expect(easeDrawer(0.3)).toBeGreaterThan(0.5)
        let previous = 0
        for (let x = 0.05; x <= 1; x += 0.05) {
            const value = easeDrawer(x)
            expect(value).toBeGreaterThanOrEqual(previous - 1e-9)
            previous = value
        }
    })
})
