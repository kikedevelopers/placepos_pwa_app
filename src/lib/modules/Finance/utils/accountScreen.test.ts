import { describe, expect, it } from 'vitest'
import type { FinancialMovement } from '$lib/api/requests/financial-movements/types'
import { movementTotals, snapIndex, totalBalance } from './accountScreen'

describe('snapIndex', () => {
    it('elige la tarjeta más cercana al desplazamiento', () => {
        expect(snapIndex(0, 300, 3)).toBe(0)
        expect(snapIndex(160, 300, 3)).toBe(1)
        expect(snapIndex(590, 300, 3)).toBe(2)
    })

    it('acota a los extremos y tolera valores raros', () => {
        expect(snapIndex(-50, 300, 3)).toBe(0)
        expect(snapIndex(9000, 300, 3)).toBe(2)
        expect(snapIndex(100, 0, 3)).toBe(0)
        expect(snapIndex(100, 300, 0)).toBe(0)
        expect(snapIndex(Number.NaN, 300, 3)).toBe(0)
    })
})

const mv = (id: number, movement_type: FinancialMovement['movement_type'], amount: number): FinancialMovement =>
    ({ id, movement_type, amount, concept: 'X', description: null, created_at: '2026-10-24T10:00:00.000Z' }) as unknown as FinancialMovement

describe('movementTotals', () => {
    it('suma entradas (ingresos y traslados recibidos) y salidas', () => {
        const t = movementTotals([mv(1, 'INCOME', 1000), mv(2, 'TRANSFER', 500), mv(3, 'EXPENSE', 300)])
        expect(t).toEqual({ income: 1500, expense: 300, net: 1200, count: 3 })
    })

    it('sin movimientos todo en cero', () => {
        expect(movementTotals([])).toEqual({ income: 0, expense: 0, net: 0, count: 0 })
    })

    it('sin ruido de coma flotante', () => {
        expect(movementTotals([mv(1, 'INCOME', 0.1), mv(2, 'INCOME', 0.2)]).income).toBe(0.3)
    })

    it('neto negativo cuando sale más de lo que entra', () => {
        expect(movementTotals([mv(1, 'EXPENSE', 800), mv(2, 'INCOME', 200)]).net).toBe(-600)
    })
})

describe('totalBalance', () => {
    it('suma saldos sin ruido y tolera nulos o strings', () => {
        expect(totalBalance([{ balance: 0.1 }, { balance: 0.2 }])).toBe(0.3)
        expect(totalBalance([{ balance: '1500.5' }, { balance: null }, { balance: undefined }])).toBe(1500.5)
        expect(totalBalance([])).toBe(0)
    })
})
