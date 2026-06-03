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
