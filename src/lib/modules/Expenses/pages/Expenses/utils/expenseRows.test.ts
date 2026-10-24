import { describe, expect, it } from 'vitest'
import { dayKey } from '$lib/components/premium/listing'
import { expenseInstant, sourceLabel } from './expenseRows'

describe('sourceLabel', () => {
    it('no repite el tipo cuando el nombre ya lo dice', () => {
        expect(sourceLabel({ source_type: 'cash_register', source_name: 'Caja de Enrique Pacheco' })).toBe('Caja de Enrique Pacheco')
    })

    it('banco y billetera con su nombre', () => {
        expect(sourceLabel({ source_type: 'bank', source_name: 'NU BANK' })).toBe('Banco · NU BANK')
        expect(sourceLabel({ source_type: 'wallet', source_name: 'CAJA CHICA' })).toBe('Billetera · CAJA CHICA')
    })

    it('sin nombre solo el tipo', () => {
        expect(sourceLabel({ source_type: 'wallet', source_name: null })).toBe('Billetera')
        expect(sourceLabel({ source_type: 'bank', source_name: '  ' })).toBe('Banco')
    })
})

describe('expenseInstant', () => {
    it('una fecha sola NO se corre al día anterior', () => {
        expect(dayKey(expenseInstant({ expense_date: '2026-07-14', created_at: '2026-07-15T03:00:00.000Z' }))).toBe('2026-07-14')
    })

    it('fecha con hora se respeta; sin fecha usa created_at', () => {
        expect(expenseInstant({ expense_date: '2026-07-14T10:00:00.000Z', created_at: 'x' })).toBe('2026-07-14T10:00:00.000Z')
        expect(expenseInstant({ expense_date: '', created_at: '2026-07-15T03:00:00.000Z' })).toBe('2026-07-15T03:00:00.000Z')
    })
})
