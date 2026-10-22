import { describe, it, expect } from 'vitest'
import type { BreakEvenProgress } from '$lib/api/requests/dashboard'
import { computeDerived, formatGoalPercent, resolveTone } from './goalDerived'

const data = (partial: Partial<BreakEvenProgress> = {}): BreakEvenProgress =>
    ({
        configured: true,
        breakEvenAmount: 4_370_000,
        breakEvenPeriodDays: 26,
        dailyTarget: 168_076.92,
        monthFrom: '2026-10-01',
        monthTo: '2026-10-22',
        monthRealProfit: 6_450,
        monthProgress: 6_450 / 4_370_000,
        dayRealProfit: 0,
        dayProgress: 0,
        ...partial
    }) as BreakEvenProgress

describe('computeDerived', () => {
    it('sin datos o sin configurar devuelve null', () => {
        expect(computeDerived(undefined)).toBeNull()
        expect(computeDerived(data({ configured: false }))).toBeNull()
    })

    it('arma rango, faltante y ritmo con el modelo de la cuota diaria', () => {
        const d = computeDerived(data())!
        expect(d.monthRange).toBe('1 – 22 oct 2026')
        expect(d.deficit).toBe(4_363_550)
        expect(d.expectedToDate).toBe(3_697_692.24)
        expect(d.paceShare).toBeCloseTo(3_697_692.24 / 4_370_000)
        expect(d.pace?.elapsed_days).toBe(22)
        expect(d.tone).toBe('danger')
    })

    it('meta superada: excedente y tono de éxito', () => {
        const d = computeDerived(data({ monthRealProfit: 5_000_000, monthProgress: 5_000_000 / 4_370_000 }))!
        expect(d.isReached).toBe(true)
        expect(d.surplus).toBe(630_000)
        expect(d.deficit).toBe(0)
        expect(d.tone).toBe('success')
    })

    it('ritmo topado en la meta y sin meta no hay marca', () => {
        expect(computeDerived(data({ monthTo: '2026-10-30' }))!.paceShare).toBe(1)
        expect(computeDerived(data({ breakEvenAmount: 0, dailyTarget: 0 }))!.paceShare).toBe(0)
    })
})

describe('formatGoalPercent / resolveTone', () => {
    it('nunca muestra 100% sin haber llegado', () => {
        expect(formatGoalPercent(99.96, false)).toBe('99.9%')
        expect(formatGoalPercent(130, true)).toBe('130.0%')
    })

    it('semáforo: <40% rojo, 40–99% ámbar, ≥100% verde', () => {
        expect(resolveTone(0.39)).toBe('danger')
        expect(resolveTone(0.4)).toBe('warning')
        expect(resolveTone(1)).toBe('success')
    })
})
