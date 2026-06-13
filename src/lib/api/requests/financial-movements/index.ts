import api from '$lib/api/config'
import type { ApiPayload } from '$lib/api/requests/dashboard/types'
import type { AccountType, FinancialMovement } from './types'

export interface MovementsDateRange {
    from?: string
    to?: string
}

/**
 * Movimientos de una cuenta (billetera/banco), ordenados por fecha desc. en el
 * backend. `from`/`to` (instantes ISO) son opcionales: filtran por rango de
 * fechas; sin ellos devuelve todo el historial (paridad pos_api).
 */
export const getMovements = async (
    account_type: AccountType,
    account_id: number,
    range?: MovementsDateRange
): Promise<FinancialMovement[]> => {
    const response = await api.get<ApiPayload<FinancialMovement[]>>('/financial-movements', {
        params: {
            account_type,
            account_id,
            ...(range?.from ? { from: range.from } : {}),
            ...(range?.to ? { to: range.to } : {})
        }
    })
    return response.data.payload
}

export * from './types'
