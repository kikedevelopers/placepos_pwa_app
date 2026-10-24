import { formatCurrency, formatNumber } from '$lib/utils/numbers'
import { MONTHS_LONG, MONTHS_SHORT, parseDateKey } from '$lib/utils/calendarNames'
import type { ComparativeGrowth } from '$lib/api/requests/reports/comparative'

// Espejo EXACTO de placepos (ComparativeReport/comparisonModel.ts), con las
// fechas formateadas sin dayjs (nombres fijos de calendarNames).
// Modelo puro de la Comparativa (testeado): de la lista de periodos que da el
// backend a lo que se pinta. Los periodos llegan en orden cronológico: el
// primero es la BASE y el último el ACTUAL.

/** Lo mínimo que la vista necesita de un periodo (sirve para período y día). */
export interface ComparablePeriod {
    label: string
    // Rango o fecha legible debajo del nombre.
    detail: string
    sales: number
    profit: number
    margin: number
    // Variación contra el periodo anterior; null en la base.
    growth: ComparativeGrowth | null
}

export type PeriodRole = 'base' | 'middle' | 'latest'
export type Tone = 'positive' | 'negative' | 'neutral'

export const periodRole = (index: number, total: number): PeriodRole =>
    index === total - 1 ? 'latest' : index === 0 ? 'base' : 'middle'

const ROLE_COLORS: Record<PeriodRole, string> = {
    base: 'hsl(var(--muted-foreground) / 0.45)',
    middle: 'hsl(var(--primary) / 0.45)',
    latest: 'hsl(var(--primary))'
}

/** Color del periodo: el actual en el primario, la base en gris, el medio a media tinta. */
export const periodColor = (index: number, total: number): string => ROLE_COLORS[periodRole(index, total)]

export const ROLE_LABELS: Record<PeriodRole, string> = {
    base: 'Base',
    middle: 'Intermedio',
    latest: 'Actual'
}

export const toneOf = (value: number | null | undefined): Tone => {
    if (value === null || value === undefined || value === 0 || !Number.isFinite(value)) return 'neutral'
    return value > 0 ? 'positive' : 'negative'
}

const sign = (value: number): string => (value > 0 ? '+' : value < 0 ? '−' : '')

/** "+12,4 %" / "−50,6 %" (signo tipográfico, coma decimal). null → "—". */
export const formatPercent = (value: number | null): string => {
    if (value === null || !Number.isFinite(value)) return '—'
    return `${sign(value)}${formatNumber(Math.abs(value), 1)} %`
}

/** "+1,6 pts": variación del margen en puntos porcentuales. */
export const formatPoints = (value: number): string => `${sign(value)}${formatNumber(Math.abs(value), 1)} pts`

/** "+$ 7.350" / "−$ 40.900". */
export const formatSignedCurrency = (value: number): string => `${sign(value)}${formatCurrency(Math.abs(value))}`

export type MetricKey = 'sales' | 'profit' | 'margin'

export interface MetricBar {
    label: string
    detail: string
    role: PeriodRole
    color: string
    value: string
    // Largo de la barra, 0..1, relativo al mayor valor de la métrica.
    ratio: number
}

export interface MetricComparison {
    key: MetricKey
    label: string
    bars: MetricBar[]
    // Variación del ACTUAL contra el periodo anterior (null si no hay anterior).
    delta: { primary: string; secondary: string | null; tone: Tone } | null
}

const METRIC_LABELS: Record<MetricKey, string> = { sales: 'Ventas', profit: 'Ganancia', margin: 'Margen' }

const formatValue = (key: MetricKey, value: number): string =>
    key === 'margin' ? `${formatNumber(value, 1)} %` : formatCurrency(value)

const deltaOf = (key: MetricKey, growth: ComparativeGrowth): MetricComparison['delta'] => {
    if (key === 'margin') {
        return { primary: formatPoints(growth.marginDelta), secondary: null, tone: toneOf(growth.marginDelta) }
    }
    const pct = key === 'sales' ? growth.salesPct : growth.profitPct
    const abs = key === 'sales' ? growth.salesDelta : growth.profitDelta
    return {
        primary: pct === null ? formatSignedCurrency(abs) : formatPercent(pct),
        secondary: pct === null ? null : formatSignedCurrency(abs),
        // El tono sigue al dinero: sin base porcentual (base en 0) manda el delta.
        tone: toneOf(pct ?? abs)
    }
}

/**
 * Una comparación por métrica: una barra por periodo (largo proporcional al
 * mayor valor; negativos y ceros quedan en 0) y la variación del actual.
 */
export function buildMetricComparisons(periods: ComparablePeriod[]): MetricComparison[] {
    const total = periods.length
    const latest = periods[total - 1]
    return (['sales', 'profit', 'margin'] as MetricKey[]).map((key) => {
        const max = Math.max(0, ...periods.map((p) => p[key]))
        return {
            key,
            label: METRIC_LABELS[key],
            bars: periods.map((period, index) => ({
                label: period.label,
                detail: period.detail,
                role: periodRole(index, total),
                color: periodColor(index, total),
                value: formatValue(key, period[key]),
                ratio: max > 0 ? Math.min(1, Math.max(0, period[key] / max)) : 0
            })),
            delta: latest?.growth ? deltaOf(key, latest.growth) : null
        }
    })
}

/** "Octubre 2026 frente a Septiembre 2026" (actual vs su anterior). */
export function headline(periods: ComparablePeriod[]): string {
    if (periods.length === 0) return 'Compara el desempeño del negocio entre periodos'
    const latest = periods[periods.length - 1]
    if (periods.length === 1) return latest.label
    return `${latest.label} frente a ${periods[periods.length - 2].label}`
}

const dmy = (d: Date, withYear: boolean): string =>
    `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}${withYear ? ` ${d.getFullYear()}` : ''}`

/** "1 sep – 24 oct 2026" (sin repetir el año si coincide). */
export const formatCompactRange = (from: string, to: string): string => {
    const start = parseDateKey(from)
    const end = parseDateKey(to)
    return `${dmy(start, start.getFullYear() !== end.getFullYear())} – ${dmy(end, true)}`
}

/** "1 – 24 oct 2026" / "28 sep – 3 oct 2026" para el rango de un periodo. */
export const formatPeriodRange = (from: string, to: string): string => {
    const start = parseDateKey(from)
    const end = parseDateKey(to)
    if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
        return `${start.getDate()} – ${dmy(end, true)}`
    }
    return formatCompactRange(from, to)
}

/** Día de un mes en texto: "24 de octubre de 2026". */
export const formatDayDate = (date: string): string => {
    const d = parseDateKey(date)
    return `${d.getDate()} de ${MONTHS_LONG[d.getMonth()]} de ${d.getFullYear()}`
}
