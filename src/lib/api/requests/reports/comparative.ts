import api from '$lib/api/config'
import type { ApiPayload } from '$lib/api/requests/dashboard/types'

/** Granularidad de los periodos comparados (paridad con placepos). */
export type ComparativeGranularity =
    | 'weekly'
    | 'biweekly'
    | 'monthly'
    | 'quarterly'
    | 'semiannual'
    | 'annual'

export interface ComparativeGrowth {
    salesPct: number | null
    salesDelta: number
    profitPct: number | null
    profitDelta: number
    marginDelta: number
}

export interface ComparativePeriod {
    label: string
    from: string
    to: string
    sales: number
    cost: number
    profit: number
    margin: number
    growth: ComparativeGrowth | null
}

export interface ComparativeBreakdownRow {
    label: string
    periods: Array<{
        from: string
        to: string
        sales: number
        cost: number
        profit: number
        margin: number
        growth: ComparativeGrowth | null
    }>
}

export interface ComparativeReportResult {
    granularity: ComparativeGranularity
    reference: string
    count: number
    offset: number
    toDate: boolean
    canGoForward: boolean
    periods: ComparativePeriod[]
    breakdown: ComparativeBreakdownRow[]
}

export interface ComparativeReportParams {
    granularity?: ComparativeGranularity
    reference?: string
    count?: 2 | 3
    offset?: number
}

export const getComparativeReport = async (
    params: ComparativeReportParams = {}
): Promise<ComparativeReportResult> => {
    const response = await api.get<ApiPayload<ComparativeReportResult>>('/pos-reports/comparative', {
        params
    })
    return response.data.payload
}

// ---- Comparativa por día (GET /pos-reports/comparative/by-day) ----
// El MISMO día del mes en el mes de referencia y los anteriores (paridad placepos).

export interface ComparativeDayParams {
    /** Hoy (YYYY-MM-DD): ancla el mes "actual". */
    reference: string
    /** Día del mes a comparar (1..31). */
    day: number
    count: 2 | 3
}

export interface ComparativeDayPeriod {
    label: string
    /** Fecha real usada (YYYY-MM-DD), ajustada si el mes era más corto. */
    date: string
    requestedDay: number
    /** true si el mes no tenía ese día y se usó el último. */
    clamped: boolean
    sales: number
    cost: number
    profit: number
    margin: number
    growth: ComparativeGrowth | null
}

export interface ComparativeDayResult {
    reference: string
    day: number
    count: number
    periods: ComparativeDayPeriod[]
}

export const getComparativeDayReport = async (params: ComparativeDayParams): Promise<ComparativeDayResult> => {
    const response = await api.get<ApiPayload<ComparativeDayResult>>('/pos-reports/comparative/by-day', {
        params
    })
    return response.data.payload
}
