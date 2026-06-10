import api from '$lib/api/config'
import type { CompanyProfile } from '$lib/api/requests/authentication/types'

/**
 * Multi-sucursal (cloud). El owner gestiona sus companies (negocio principal +
 * sucursales) y cambia entre ellas re-emitiendo el JWT. Contrato de pos_api.
 */
export interface CreateBranchPayload {
    company_name: string
    document_number?: string
    address?: string
    email?: string
    phone_number?: string
}

interface Envelope<T> {
    success: boolean
    payload: T
    error?: string
}

export const createBranch = async (payload: CreateBranchPayload): Promise<CompanyProfile> => {
    const response = await api.post<Envelope<CompanyProfile>>('/branches', payload)
    return response.data.payload
}

export const switchBranch = async (companyId: number): Promise<{ access_token: string }> => {
    const response = await api.post<Envelope<{ access_token: string }>>(
        `/branches/${companyId}/switch`,
        {}
    )
    return response.data.payload
}

/**
 * Reconciliación: el owner elige qué sucursales conservar activas (cuando el
 * admin reduce el límite). El resto queda suspendido. El principal va implícito.
 */
export const setActiveBranches = async (companyIds: number[]): Promise<{ updated: true }> => {
    const response = await api.put<Envelope<{ updated: true }>>('/branches/active', {
        active_company_ids: companyIds
    })
    return response.data.payload
}
