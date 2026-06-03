import api from '$lib/api/config'
import type { ApiPayload } from '$lib/api/requests/dashboard/types'

export interface CustomerRfmDayBreakdown {
    date: string
    total: number
    cost: number
    ticketCount: number
}

export interface CustomerRfm {
    customerId: number
    customerName: string
    phone: string | null
    docNumber: string | null
    purchaseDates: number
    ticketCount: number
    lastPurchaseDate: string
    daysSinceLast: number
    avgPeriodDays: number | null
    overdue: boolean
    totalAmount: number
    totalCost: number
    totalProfit: number
    totalMargin: number
    dailyBreakdown: CustomerRfmDayBreakdown[]
}

export interface CustomersRfmResult {
    from: string
    to: string
    referenceDate: string
    customers: CustomerRfm[]
}

export interface CustomersRfmParams {
    from?: string
    to?: string
}

export const getCustomersRfm = async (
    params: CustomersRfmParams = {}
): Promise<CustomersRfmResult> => {
    const response = await api.get<ApiPayload<CustomersRfmResult>>('/reports/customers-rfm', {
        params
    })
    return response.data.payload
}
