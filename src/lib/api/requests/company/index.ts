import api from '$lib/api/config'
import type { ApiPayload } from '$lib/api/requests/dashboard/types'

/** Datos del negocio (espejo de `/companies` en pos_api). */
export type Company = {
    id: number
    name: string
    document_number: string | null
    address: string | null
    email: string | null
    phone_number: string | null
    break_even_amount: number
    break_even_period_days: number
    created_at: string
    updated_at: string
}

export type UpdateCompanyPayload = {
    name?: string
    document_number?: string
    address?: string
    email?: string
    phone_number?: string
    break_even_amount?: number
    break_even_period_days?: number
}

/** Obtiene la company actual (resuelta por el tenant del JWT). */
export const getCompany = async (): Promise<Company> => {
    const response = await api.get<ApiPayload<Company>>('/companies')
    return response.data.payload
}

/** Actualiza la company. Solo el owner (403 cross-tenant si el id no coincide). */
export const updateCompany = async (
    companyId: number,
    payload: UpdateCompanyPayload
): Promise<Company> => {
    const response = await api.put<ApiPayload<Company>>(`/companies/${companyId}`, payload)
    return response.data.payload
}
