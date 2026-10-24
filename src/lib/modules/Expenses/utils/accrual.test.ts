import { describe, expect, it } from 'vitest'
import type { FixedExpense } from '$lib/api/requests/fixedExpenses'
import { accruedInPeriodNumber, computeAccrual, monthlyProjection, ratePerDay, ratePerHour } from './accrual'

const expense = (over: Partial<FixedExpense> = {}): FixedExpense =>
    ({
        id: 1,
        name: 'ARRIENDO',
        amount: 720000,
        period_unit: 'month',
        period_quantity: 1,
        start_date: '2026-06-01T05:00:00.000Z',
        ...over
    }) as FixedExpense

describe('devengo de intervalo fijo (legacy)', () => {
    it('mes = 30 días: 720.000 → 1.000 por hora', () => {
        expect(ratePerHour(expense()).toNumber()).toBe(1000)
        expect(ratePerDay(expense()).toNumber()).toBe(24000)
        expect(monthlyProjection(expense())).toBe(720000)
    })

    it('a mitad del primer periodo lleva la mitad', () => {
        const now = new Date(Date.parse('2026-06-01T05:00:00.000Z') + 15 * 24 * 3_600_000)
        const s = computeAccrual(expense(), now)
        expect(s.completedPeriods).toBe(0)
        expect(s.currentPeriodProgress).toBeCloseTo(0.5, 6)
        expect(accruedInPeriodNumber(expense(), now)).toBe(360000)
    })

    it('antes del inicio todo en cero', () => {
        const s = computeAccrual(expense(), new Date('2026-05-01T00:00:00.000Z'))
        expect(s.accruedTotal.toNumber()).toBe(0)
        expect(s.completedPeriods).toBe(0)
    })
})

describe('devengo de calendario', () => {
    const now = new Date(Date.parse('2026-10-24T15:00:00-05:00'))

    it('Quincenal: NO revienta (antes la PWA no conocía semimonthly) y proyecta 2 × monto', () => {
        const nomina = expense({ amount: 600000, period_unit: 'semimonthly' })
        expect(() => computeAccrual(nomina, now)).not.toThrow()
        expect(monthlyProjection(nomina)).toBe(1200000)
        const s = computeAccrual(nomina, now)
        expect(s.completedPeriods).toBe(9)
        expect(s.currentPeriodProgress).toBeGreaterThan(0)
        expect(s.currentPeriodProgress).toBeLessThan(1)
        expect(accruedInPeriodNumber(nomina, now)).toBeGreaterThan(0)
        expect(accruedInPeriodNumber(nomina, now)).toBeLessThan(600000)
    })

    it('Mensual (fin de mes): proyección = monto y el periodo cierra el último día', () => {
        const fin = expense({ amount: 500000, period_unit: 'end_of_month' })
        expect(monthlyProjection(fin)).toBe(500000)
        expect(computeAccrual(fin, now).currentPeriodEnd.toISOString()).toBe(new Date(Date.parse('2026-10-31T23:59:59.999-05:00')).toISOString())
    })

    it('la tasa por hora usa la duración REAL del periodo actual', () => {
        const fin = expense({ amount: 500000, period_unit: 'end_of_month' })
        const s = computeAccrual(fin, now)
        const hours = (s.currentPeriodEnd.getTime() - s.currentPeriodStart.getTime()) / 3_600_000
        expect(ratePerHour(fin, now).toNumber()).toBeCloseTo(500000 / hours, 6)
    })
})
