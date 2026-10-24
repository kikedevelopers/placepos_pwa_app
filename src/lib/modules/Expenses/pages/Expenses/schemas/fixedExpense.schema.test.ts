import { describe, expect, it } from 'vitest'
import { PERIOD_UNIT_VALUES, fixedExpenseSchema, normalizePeriodQuantity } from './fixedExpense.schema'

const base = { name: 'Nómina', description: '', amount: 600000, period_quantity: 1, start_date: '2026-06-01' }

describe('fixedExpenseSchema', () => {
    it('acepta las convenciones de calendario de placepos', () => {
        expect(PERIOD_UNIT_VALUES).toContain('semimonthly')
        expect(PERIOD_UNIT_VALUES).toContain('end_of_month')
        expect(fixedExpenseSchema.safeParse({ ...base, period_unit: 'semimonthly' }).success).toBe(true)
        expect(fixedExpenseSchema.safeParse({ ...base, period_unit: 'end_of_month' }).success).toBe(true)
    })

    it('rechaza unidad desconocida, monto 0 y fecha inválida', () => {
        expect(fixedExpenseSchema.safeParse({ ...base, period_unit: 'year' }).success).toBe(false)
        expect(fixedExpenseSchema.safeParse({ ...base, period_unit: 'month', amount: 0 }).success).toBe(false)
        expect(fixedExpenseSchema.safeParse({ ...base, period_unit: 'month', start_date: 'xx' }).success).toBe(false)
    })
})

describe('normalizePeriodQuantity', () => {
    it('calendario siempre 1; intervalo fijo respeta la cantidad', () => {
        expect(normalizePeriodQuantity('semimonthly', 4)).toBe(1)
        expect(normalizePeriodQuantity('end_of_month', 3)).toBe(1)
        expect(normalizePeriodQuantity('day', 15)).toBe(15)
    })
})
