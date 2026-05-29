import api from '$lib/api/config'
import type { ApiPayload } from '$lib/api/requests/dashboard/types'
import type { Product, ProductListParams, ProductPayload } from './types'

type MutationResult = { id: number; name: string }

export const getProducts = async (params: ProductListParams = {}): Promise<Product[]> => {
    const response = await api.get<ApiPayload<Product[]>>('/inventory', { params })
    return response.data.payload
}

export const createProduct = async (payload: ProductPayload): Promise<MutationResult> => {
    const response = await api.post<ApiPayload<MutationResult>>('/inventory', payload)
    return response.data.payload
}

export const updateProduct = async (
    id: number,
    payload: ProductPayload
): Promise<MutationResult> => {
    const response = await api.put<ApiPayload<MutationResult>>(`/inventory/${id}`, payload)
    return response.data.payload
}

export * from './types'
