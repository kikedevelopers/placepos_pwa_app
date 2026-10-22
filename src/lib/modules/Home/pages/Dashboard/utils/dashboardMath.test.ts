import { describe, it, expect } from 'vitest'
import {
    buildSalesComposition,
    clampShare,
    computeMonthPace,
    expectedToDate,
    formatDayRange,
    parseDay
} from './dashboardMath'

describe('parseDay', () => {
    it('interpreta el día en hora local (no corre al día anterior por UTC)', () => {
        const d = parseDay('2026-10-01')
        expect(d?.getFullYear()).toBe(2026)
        expect(d?.getMonth()).toBe(9)
        expect(d?.getDate()).toBe(1)
    })

    it('rechaza formatos y días inexistentes', () => {
        expect(parseDay('2026-02-30')).toBeNull()
        expect(parseDay('01/10/2026')).toBeNull()
        expect(parseDay('')).toBeNull()
    })
})

describe('formatDayRange', () => {
    it('mismo mes: "1 – 22 oct 2026" (sin correrse al 30 de sept por UTC)', () => {
        expect(formatDayRange('2026-10-01', '2026-10-22')).toBe('1 – 22 oct 2026')
    })

    it('entre meses y entre años muestra cada mes', () => {
        expect(formatDayRange('2026-09-28', '2026-10-03')).toMatch(/^28 sept? – 3 oct 2026$/)
        expect(formatDayRange('2025-12-30', '2026-01-02')).toMatch(/^30 dic 2025 – 2 ene 2026$/)
    })

    it('con fechas inválidas devuelve el texto crudo', () => {
        expect(formatDayRange('x', '2026-10-22')).toBe('x – 2026-10-22')
    })
})

describe('computeMonthPace / expectedByPace', () => {
    it('cuenta los días con hoy incluido sobre los días del mes', () => {
        expect(computeMonthPace('2026-10-01', '2026-10-22')).toEqual({
            elapsed_days: 22,
            days_in_month: 31,
            share: Number((22 / 31).toFixed(6))
        })
    })

    it('febrero no bisiesto termina en 100%', () => {
        expect(computeMonthPace('2026-02-01', '2026-02-28')?.share).toBe(1)
    })

    it('null con fechas inválidas o invertidas', () => {
        expect(computeMonthPace('basura', '2026-10-22')).toBeNull()
        expect(computeMonthPace('2026-10-22', '2026-10-01')).toBeNull()
    })

    it('esperado = cuota diaria × días transcurridos (mismo modelo del backend)', () => {
        const pace = computeMonthPace('2026-10-01', '2026-10-22')!
        // Meta 4.370.000 en un período de 26 días → cuota 168.076,92.
        expect(expectedToDate(168_076.92, 4_370_000, pace)).toBe(3_697_692.24)
    })

    it('se topa en la meta cuando los días superan el período', () => {
        const pace = computeMonthPace('2026-10-01', '2026-10-30')!
        expect(expectedToDate(168_076.92, 4_370_000, pace)).toBe(4_370_000)
    })

    it('sin cuota o sin meta no hay esperado', () => {
        const pace = computeMonthPace('2026-10-01', '2026-10-22')!
        expect(expectedToDate(0, 4_370_000, pace)).toBe(0)
        expect(expectedToDate(100, 0, pace)).toBe(0)
    })
})

describe('buildSalesComposition', () => {
    const base = { cashSales: 600, transferSales: 400, creditSales: 0, ordersTotal: 0, totalSales: 1000 }

    it('sin crédito ni pedidos muestra solo efectivo y consignaciones', () => {
        const segs = buildSalesComposition(base)
        expect(segs.map((s) => s.key)).toEqual(['cash', 'transfer'])
        expect(segs.map((s) => s.share)).toEqual([0.6, 0.4])
    })

    it('incluye crédito y pedidos cuando hubo', () => {
        const segs = buildSalesComposition({
            cashSales: 500,
            transferSales: 200,
            creditSales: 200,
            ordersTotal: 100,
            totalSales: 1000
        })
        expect(segs.map((s) => s.key)).toEqual(['cash', 'transfer', 'credit', 'orders'])
        expect(segs.reduce((acc, s) => acc + s.share, 0)).toBeCloseTo(1)
    })

    it('día sin ventas: fracciones en 0 (sin dividir por cero)', () => {
        const segs = buildSalesComposition({ ...base, cashSales: 0, transferSales: 0, totalSales: 0 })
        expect(segs.every((s) => s.share === 0)).toBe(true)
    })

    it('un valor negativo (devoluciones) no aporta fracción a la barra', () => {
        const segs = buildSalesComposition({ ...base, cashSales: -50, transferSales: 1050 })
        expect(segs[0]).toMatchObject({ key: 'cash', value: -50, share: 0 })
        expect(segs[1].share).toBe(1)
    })

    it('tolera ordersTotal ausente (backend viejo)', () => {
        const legacy = { ...base, ordersTotal: undefined as unknown as number }
        expect(buildSalesComposition(legacy).map((s) => s.key)).toEqual(['cash', 'transfer'])
    })
})

describe('clampShare', () => {
    it('acota a 0..1 y neutraliza no finitos', () => {
        expect(clampShare(1.4)).toBe(1)
        expect(clampShare(-0.2)).toBe(0)
        expect(clampShare(Number.NaN)).toBe(0)
        expect(clampShare(0.5)).toBe(0.5)
    })
})
