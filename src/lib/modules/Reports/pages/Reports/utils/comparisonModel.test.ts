import { describe, expect, it } from 'vitest'
import {
    buildMetricComparisons,
    formatCompactRange,
    formatDayDate,
    formatPercent,
    formatPeriodRange,
    formatPoints,
    formatSignedCurrency,
    headline,
    periodColor,
    periodRole,
    toneOf,
    type ComparablePeriod
} from './comparisonModel'

const base: ComparablePeriod = { label: 'Septiembre 2026', detail: '1 – 24 sep 2026', sales: 80800, profit: 15800, margin: 19.6, growth: null }
const current: ComparablePeriod = {
    label: 'Octubre 2026',
    detail: '1 – 24 oct 2026',
    sales: 39900,
    profit: 8450,
    margin: 21.2,
    growth: { salesPct: -50.6, salesDelta: -40900, profitPct: -46.5, profitDelta: -7350, marginDelta: 1.6 }
}

describe('roles y colores', () => {
    it('el primero es la base, el último el actual, el resto intermedio', () => {
        expect([0, 1, 2].map((i) => periodRole(i, 3))).toEqual(['base', 'middle', 'latest'])
        expect([0, 1].map((i) => periodRole(i, 2))).toEqual(['base', 'latest'])
    })

    it('el actual usa el primario y la base el gris', () => {
        expect(periodColor(1, 2)).toBe('hsl(var(--primary))')
        expect(periodColor(0, 2)).toContain('--muted-foreground')
        expect(periodColor(1, 3)).toBe('hsl(var(--primary) / 0.45)')
    })
})

describe('formatos', () => {
    it('porcentajes con signo tipográfico y coma', () => {
        expect(formatPercent(-50.6)).toBe('−50,6 %')
        expect(formatPercent(12.44)).toBe('+12,4 %')
        expect(formatPercent(0)).toBe('0 %')
        expect(formatPercent(null)).toBe('—')
    })

    it('puntos y dinero con signo', () => {
        expect(formatPoints(1.6)).toBe('+1,6 pts')
        expect(formatPoints(-0.25)).toBe('−0,3 pts')
        expect(formatSignedCurrency(-40900)).toMatch(/^−\$\s?40\.900$/)
        expect(formatSignedCurrency(7350)).toMatch(/^\+\$\s?7\.350$/)
    })

    it('tono', () => {
        expect(toneOf(3)).toBe('positive')
        expect(toneOf(-1)).toBe('negative')
        expect(toneOf(0)).toBe('neutral')
        expect(toneOf(null)).toBe('neutral')
        expect(toneOf(Number.NaN)).toBe('neutral')
    })

    it('rangos en español', () => {
        expect(formatPeriodRange('2026-10-01', '2026-10-24')).toBe('1 – 24 oct 2026')
        expect(formatPeriodRange('2026-09-28', '2026-10-04')).toBe('28 sep – 4 oct 2026')
        expect(formatCompactRange('2025-12-01', '2026-01-24')).toBe('1 dic 2025 – 24 ene 2026')
        expect(formatDayDate('2026-10-24')).toBe('24 de octubre de 2026')
    })
})

describe('buildMetricComparisons', () => {
    const [sales, profit, margin] = buildMetricComparisons([base, current])

    it('una comparación por métrica, en orden', () => {
        expect([sales.label, profit.label, margin.label]).toEqual(['Ventas', 'Ganancia', 'Margen'])
    })

    it('barras proporcionales al mayor valor de la métrica', () => {
        expect(sales.bars.map((b) => b.ratio)).toEqual([1, 39900 / 80800])
        expect(margin.bars[1].ratio).toBe(1)
        expect(sales.bars.map((b) => b.role)).toEqual(['base', 'latest'])
    })

    it('variación del actual: % y dinero; margen en puntos', () => {
        expect(sales.delta).toMatchObject({ primary: '−50,6 %', tone: 'negative' })
        expect(sales.delta?.secondary).toMatch(/^−\$\s?40\.900$/)
        expect(profit.delta).toMatchObject({ primary: '−46,5 %', tone: 'negative' })
        expect(margin.delta).toEqual({ primary: '+1,6 pts', secondary: null, tone: 'positive' })
    })

    it('base en cero (sin %): manda el dinero', () => {
        const [s] = buildMetricComparisons([
            { ...base, sales: 0 },
            { ...current, growth: { ...current.growth!, salesPct: null, salesDelta: 39900 } }
        ])
        expect(s.delta?.primary).toMatch(/^\+\$\s?39\.900$/)
        expect(s.delta?.tone).toBe('positive')
        expect(s.bars[0].ratio).toBe(0)
    })

    it('valores negativos o todo en cero: barras en 0, sin dividir por cero', () => {
        const [, p] = buildMetricComparisons([
            { ...base, profit: -500 },
            { ...current, profit: 0 }
        ])
        expect(p.bars.map((b) => b.ratio)).toEqual([0, 0])
    })

    it('un solo periodo (sin anterior): sin variación', () => {
        expect(buildMetricComparisons([base])[0].delta).toBeNull()
    })
})

describe('headline', () => {
    it('actual frente a su anterior', () => {
        expect(headline([base, current])).toBe('Octubre 2026 frente a Septiembre 2026')
    })

    it('uno o ninguno', () => {
        expect(headline([base])).toBe('Septiembre 2026')
        expect(headline([])).toBe('Compara el desempeño del negocio entre periodos')
    })
})
