import api from '$lib/api/config'
import type {
    BranchesSummary,
    BreakEvenProgress,
    GetBranchesSummaryResponse,
    GetBreakEvenProgressResponse,
    GetTodayByCashierResponse,
    GetTodaySummaryResponse,
    TodayByCashier,
    TodaySummary
} from './types'

export const getTodaySummary = async (): Promise<TodaySummary> => {
    const response = await api.get<GetTodaySummaryResponse>('/dashboard/today')
    return response.data.payload
}

export const getBranchesSummary = async (date?: string): Promise<BranchesSummary> => {
    const response = await api.get<GetBranchesSummaryResponse>('/dashboard/branches-summary', {
        params: date ? { date } : undefined
    })
    return response.data.payload
}

export const getTodayByCashier = async (date?: string): Promise<TodayByCashier> => {
    const response = await api.get<GetTodayByCashierResponse>('/dashboard/today-by-cashier', {
        params: date ? { date } : undefined
    })
    return response.data.payload
}

export const getBreakEvenProgress = async (date?: string): Promise<BreakEvenProgress> => {
    const response = await api.get<GetBreakEvenProgressResponse>('/dashboard/break-even-progress', {
        params: date ? { date } : undefined
    })
    return response.data.payload
}

export * from './types'
