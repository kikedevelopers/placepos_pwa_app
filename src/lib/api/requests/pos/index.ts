import api from '$lib/api/config'
import type { ApiPayload } from '$lib/api/requests/dashboard/types'
import type {
    CreateSalePayload,
    CreateSaleResult,
    PosBank,
    PosCustomer,
    PosProduct,
    ProcessPaymentPayload,
    ProcessPaymentResult
} from './types'

export const getPosItems = async (): Promise<PosProduct[]> => {
    const response = await api.get<ApiPayload<PosProduct[]>>('/pos-data/items')
    return response.data.payload
}

export const getPosCustomers = async (): Promise<PosCustomer[]> => {
    const response = await api.get<ApiPayload<PosCustomer[]>>('/pos-data/customers')
    return response.data.payload
}

export const getPosBanks = async (): Promise<PosBank[]> => {
    const response = await api.get<ApiPayload<PosBank[]>>('/pos-data/payment-banks')
    return response.data.payload
}

export const createSale = async (payload: CreateSalePayload): Promise<CreateSaleResult> => {
    const response = await api.post<ApiPayload<CreateSaleResult>>('/sales', payload)
    return response.data.payload
}

export const processPayment = async (
    payload: ProcessPaymentPayload
): Promise<ProcessPaymentResult> => {
    const response = await api.post<ApiPayload<ProcessPaymentResult>>('/payments', payload)
    return response.data.payload
}

export * from './types'
