import api from '$lib/api/config'
import type { ApiPayload } from '$lib/api/requests/dashboard/types'
import type { CustomerCategory, CreateCustomerCategoryPayload } from './types'

export const getCustomerCategories = async (): Promise<CustomerCategory[]> => {
    const response = await api.get<ApiPayload<CustomerCategory[]>>('/customer-categories')
    return response.data.payload
}

export const createCustomerCategory = async (
    payload: CreateCustomerCategoryPayload
): Promise<CustomerCategory> => {
    const response = await api.post<ApiPayload<CustomerCategory>>('/customer-categories', payload)
    return response.data.payload
}

export * from './types'
