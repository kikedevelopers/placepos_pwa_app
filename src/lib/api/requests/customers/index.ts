import api from '$lib/api/config'
import type { ApiPayload } from '$lib/api/requests/dashboard/types'
import type {
    Customer,
    CustomerAnalytics,
    CustomerListParams,
    CustomerPayload
} from './types'

export const getCustomers = async (params: CustomerListParams = {}): Promise<Customer[]> => {
    const response = await api.get<ApiPayload<Customer[]>>('/customers', { params })
    return response.data.payload
}

export const getCustomerAnalytics = async (): Promise<CustomerAnalytics> => {
    const response = await api.get<ApiPayload<CustomerAnalytics>>('/customers/analytics')
    return response.data.payload
}

export const createCustomer = async (payload: CustomerPayload): Promise<Customer> => {
    const response = await api.post<ApiPayload<Customer>>('/customers', payload)
    return response.data.payload
}

export const updateCustomer = async (
    id: number,
    payload: CustomerPayload
): Promise<Customer> => {
    const response = await api.put<ApiPayload<Customer>>(`/customers/${id}`, payload)
    return response.data.payload
}

export * from './types'
