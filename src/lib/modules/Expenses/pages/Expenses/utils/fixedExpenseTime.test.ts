import { describe, expect, it } from 'vitest'
import { nextCutLabel, remainingLabel, remainingParts } from './fixedExpenseTime'

const NOW = new Date(2026, 9, 24, 15, 0)
const later = (min: number) => new Date(NOW.getTime() + min * 60_000)

describe('remainingParts', () => {
    it('descompone en días, horas y minutos', () => {
        expect(remainingParts(later(3 * 1440 + 4 * 60 + 7), NOW)).toEqual({ days: 3, hours: 4, minutes: 7 })
    })

    it('pasado o inválido → null', () => {
        expect(remainingParts(later(-5), NOW)).toBeNull()
        expect(remainingParts(new Date(Number.NaN), NOW)).toBeNull()
    })
})

describe('nextCutLabel', () => {
    it('días, horas, minutos y ahora', () => {
        expect(nextCutLabel(later(3 * 1440 + 4 * 60), NOW)).toBe('En 3 d · 4 h')
        expect(nextCutLabel(later(2 * 1440), NOW)).toBe('En 2 d')
        expect(nextCutLabel(later(5 * 60 + 30), NOW)).toBe('En 5 h')
        expect(nextCutLabel(later(12), NOW)).toBe('En 12 m')
        expect(nextCutLabel(later(0.2), NOW)).toBe('En 1 m')
        expect(nextCutLabel(later(-1), NOW)).toBe('Ahora')
        expect(nextCutLabel(null, NOW)).toBe('—')
    })
})

describe('remainingLabel', () => {
    it('frases de la tarjeta', () => {
        expect(remainingLabel(later(1440 + 60), NOW)).toBe('Faltan 1 d · 1 h')
        expect(remainingLabel(later(125), NOW)).toBe('Faltan 2 h · 5 m')
        expect(remainingLabel(later(120), NOW)).toBe('Faltan 2 h')
        expect(remainingLabel(later(9), NOW)).toBe('Faltan 9 m')
        expect(remainingLabel(later(0.5), NOW)).toBe('Menos de un minuto')
        expect(remainingLabel(later(-3), NOW)).toBe('Se cumple ahora')
    })
})
