import { describe, it, expect } from 'vitest'
import { creditMarginPct } from './credits'

describe('creditMarginPct', () => {
    it('calcula el margen como ganancia / total × 100', () => {
        expect(creditMarginPct(70000, 7160)).toBeCloseTo(10.2286, 3)
        expect(creditMarginPct(100, 25)).toBe(25)
        expect(creditMarginPct(200, 200)).toBe(100)
    })

    it('admite ganancia negativa (venta a pérdida)', () => {
        expect(creditMarginPct(100, -20)).toBe(-20)
    })

    it('devuelve 0 cuando el total es 0 o negativo (evita dividir por cero)', () => {
        expect(creditMarginPct(0, 0)).toBe(0)
        expect(creditMarginPct(0, 500)).toBe(0)
        expect(creditMarginPct(-100, 10)).toBe(0)
    })

    it('devuelve 0 ante valores no finitos (nunca NaN/Infinity para el toFixed de la UI)', () => {
        expect(creditMarginPct(Number.NaN, 10)).toBe(0)
        expect(creditMarginPct(100, Number.NaN)).toBe(0)
        expect(creditMarginPct(Number.POSITIVE_INFINITY, 10)).toBe(0)
        expect(creditMarginPct(100, Number.NEGATIVE_INFINITY)).toBe(0)
    })

    it('devuelve 0 ante tipos no numéricos (defensivo contra payloads corruptos)', () => {
        // @ts-expect-error validación en runtime de entradas no numéricas
        expect(creditMarginPct('100', 10)).toBe(0)
        // @ts-expect-error validación en runtime de entradas no numéricas
        expect(creditMarginPct(100, null)).toBe(0)
        // @ts-expect-error validación en runtime de entradas no numéricas
        expect(creditMarginPct(undefined, undefined)).toBe(0)
    })

    it('el resultado nunca es NaN ni Infinity', () => {
        const cases: Array<[number, number]> = [
            [0, 0],
            [0, 100],
            [-1, 100],
            [100, 50]
        ]
        for (const [total, profit] of cases) {
            const r = creditMarginPct(total, profit)
            expect(Number.isFinite(r)).toBe(true)
        }
    })
})
