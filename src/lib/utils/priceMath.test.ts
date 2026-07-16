import { describe, expect, it } from 'vitest'
import {
    calculateMarginFromPrices,
    calculatePriceFields,
    calculatePriceFromMargin,
    calculateProfit
} from './priceMath'

describe('priceMath', () => {
    describe('flujo directo (precio → ganancia/margen)', () => {
        it('el caso del ejemplo: costo 2000, precio 3000 → ganancia 1000, margen 33,3333%', () => {
            expect(calculatePriceFields(3000, 2000)).toEqual({ profit: 1000, margin: 33.3333 })
        })

        it('margen 0 si el precio es 0 (no divide por cero)', () => {
            expect(calculateMarginFromPrices(0, 2000)).toBe(0)
        })

        it('vender bajo costo da ganancia y margen negativos (no se enmascara)', () => {
            expect(calculateProfit(1500, 2000)).toBe(-500)
            expect(calculateMarginFromPrices(1500, 2000)).toBe(-33.3333)
        })

        it('no arrastra ruido de coma flotante', () => {
            expect(calculateProfit(0.3, 0.1)).toBe(0.2)
        })
    })

    describe('flujo inverso (margen → precio)', () => {
        it('el caso del ejemplo: costo 2000, margen 33,3333% → precio 3000', () => {
            expect(calculatePriceFromMargin(2000, 33.3333)).toBe(3000)
        })

        it('margen 0 → el precio es el costo', () => {
            expect(calculatePriceFromMargin(2000, 0)).toBe(2000)
        })

        it('margen 50% → el precio dobla el costo', () => {
            expect(calculatePriceFromMargin(2000, 50)).toBe(4000)
        })

        it.each([
            ['costo 0 (el margen sería siempre 100%: indefinido)', 0, 30],
            ['costo negativo', -100, 30],
            ['margen negativo (vender a pérdida)', 2000, -1],
            ['margen 100% (división por cero)', 2000, 100],
            ['margen > 100% (precio negativo)', 2000, 150]
        ])('devuelve null y NO toca el precio: %s', (_caso, cost, margin) => {
            expect(calculatePriceFromMargin(cost, margin)).toBeNull()
        })
    })

    describe('IDA Y VUELTA: es lo que hace fiable el modo margen', () => {
        it.each([
            [2000, 3000],
            [1000, 1500],
            [3520, 5000],
            [1760, 2500],
            [7, 9],
            [12345, 19999],
            [100, 101],
            [999.99, 1500.5]
        ])('costo %s, precio %s → margen → el MISMO precio', (cost, price) => {
            const margin = calculateMarginFromPrices(price, cost)
            expect(calculatePriceFromMargin(cost, margin)).toBe(price)
        })

        it('con 4 decimales cuadra; con 2 NO — por eso la escala es 4', () => {
            // El motivo de que MARGIN_SCALE sea 4 y no 2, con números concretos.
            const cost = 2000
            const price = 3000
            expect(calculatePriceFromMargin(cost, calculateMarginFromPrices(price, cost))).toBe(3000)
            expect(calculatePriceFromMargin(cost, 33.33)).toBe(2999.85)
        })
    })
})
