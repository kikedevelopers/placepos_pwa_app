import api from '$lib/api/config'
import type { ApiPayload } from '$lib/api/requests/dashboard/types'
import type { Category, Packaging } from './types'

export const getCategories = async (): Promise<Category[]> => {
    const response = await api.get<ApiPayload<Category[]>>('/categories')
    return response.data.payload
}

export const createCategory = async (name: string): Promise<Category> => {
    const response = await api.post<ApiPayload<Category>>('/categories', { name })
    return response.data.payload
}

export const getPackagings = async (): Promise<Packaging[]> => {
    const response = await api.get<ApiPayload<Packaging[]>>('/packagings')
    return response.data.payload
}

export const createPackaging = async (name: string, value: number): Promise<Packaging> => {
    const response = await api.post<ApiPayload<Packaging>>('/packagings', { name, value })
    return response.data.payload
}

export * from './types'
