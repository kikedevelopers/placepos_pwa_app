import api from '$lib/api/config'
import type { ApiPayload } from '$lib/api/requests/dashboard/types'
import type { AccountType, FinancialMovement } from './types'

/**
 * Movimientos de una cuenta (billetera/banco), ordenados por fecha desc. en el
 * backend. Sin paginación (paridad pos_api): devuelve todo el historial.
 */
export const getMovements = async (
    account_type: AccountType,
    account_id: number
): Promise<FinancialMovement[]> => {
    const response = await api.get<ApiPayload<FinancialMovement[]>>('/financial-movements', {
        params: { account_type, account_id }
    })
    return response.data.payload
}

export * from './types'
