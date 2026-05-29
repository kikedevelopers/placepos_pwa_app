import api from '$lib/api/config'
import type { ApiPayload } from '$lib/api/requests/dashboard/types'
import type {
    CreditsReportResponse,
    CreditStatus,
    DailyClosure,
    SalesReportResponse
} from './types'

export type SalesReportParams = {
    dateFrom: string
    dateTo: string
    search?: string
    ticketTypes?: string[]
    noteFilter?: string
    showDeleted?: boolean
}

export const getSalesReport = async (params: SalesReportParams): Promise<SalesReportResponse> => {
    const { ticketTypes, ...rest } = params
    const response = await api.get<ApiPayload<SalesReportResponse>>('/pos-reports/sales', {
        params: {
            ...rest,
            ...(ticketTypes && ticketTypes.length ? { ticketTypes: ticketTypes.join(',') } : {})
        }
    })
    return response.data.payload
}

export type CreditsReportParams = {
    dateFrom?: string
    dateTo?: string
    search?: string
    status?: CreditStatus
}

export const getCreditsReport = async (
    params: CreditsReportParams = {}
): Promise<CreditsReportResponse> => {
    const response = await api.get<ApiPayload<CreditsReportResponse>>('/reports/credits', {
        params
    })
    return response.data.payload
}

export const getDailyClosure = async (date?: string): Promise<DailyClosure> => {
    const response = await api.get<ApiPayload<DailyClosure>>('/reports/daily-closure', {
        params: date ? { date } : undefined
    })
    return response.data.payload
}

export * from './types'
