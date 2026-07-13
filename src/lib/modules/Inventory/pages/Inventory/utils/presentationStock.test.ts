import { describe, it, expect } from 'vitest'
import { computePresentationStock, computePresentationRemainder } from './presentationStock'

describe('computePresentationStock (unidades completas de la presentación)', () => {
    it('divide el stock del padre por el factor (truncando)', () => {
        expect(computePresentationStock(100, 25)).toBe(4)
        expect(computePresentationStock(103, 25)).toBe(4)
        expect(computePresentationStock(24, 25)).toBe(0)
    })

    it('soporta factores decimales', () => {
        expect(computePresentationStock(10, 2.5)).toBe(4)
    })

    it('factor inválido → 0', () => {
        expect(computePresentationStock(100, 0)).toBe(0)
        expect(computePresentationStock(100, -1)).toBe(0)
    })
})

describe('computePresentationRemainder (merma)', () => {
    it('es el residuo tras las unidades completas', () => {
        expect(computePresentationRemainder(100, 25)).toBe(0)
        expect(computePresentationRemainder(103, 25)).toBe(3)
        expect(computePresentationRemainder(24, 25)).toBe(24)
    })

    it('factor inválido → 0', () => {
        expect(computePresentationRemainder(100, 0)).toBe(0)
    })
})
