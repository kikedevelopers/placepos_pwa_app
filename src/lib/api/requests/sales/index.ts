import api from '$lib/api/config'
import type { ApiPayload } from '$lib/api/requests/dashboard/types'
import type { SaleDetail, SaleListItem, SalesListParams } from './types'

export const getSales = async (params: SalesListParams = {}): Promise<SaleListItem[]> => {
    const response = await api.get<ApiPayload<SaleListItem[]>>('/sales', { params })
    return response.data.payload
}

export const getSale = async (id: number): Promise<SaleDetail> => {
    const response = await api.get<ApiPayload<SaleDetail>>(`/sales/${id}`)
    return response.data.payload
}

export * from './types'
