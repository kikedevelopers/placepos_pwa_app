import api from '$lib/api/config'
import type { ApiPayload } from '$lib/api/requests/dashboard/types'
import type {
    AccountTransferDestination,
    AccountTransferPayload,
    AccountTransferResult,
    TransferDestinationsResult,
    TransferSourceType
} from './types'

/** Cuentas destino disponibles para una fuente (billetera/banco). */
export const getAccountTransferDestinations = async (
    sourceType: TransferSourceType,
    sourceId: number
): Promise<AccountTransferDestination[]> => {
    const response = await api.get<ApiPayload<TransferDestinationsResult>>(
        '/accounts/transfer-destinations',
        { params: { sourceType, sourceId } }
    )
    return response.data.payload.destinations
}

/**
 * Ejecuta un traslado entre cuentas de forma atómica en el backend (debita
 * origen, acredita destino y genera dos FinancialMovement).
 */
export const transferBetweenAccounts = async (
    payload: AccountTransferPayload
): Promise<AccountTransferResult> => {
    const response = await api.post<ApiPayload<AccountTransferResult>>('/accounts/transfer', payload)
    return response.data.payload
}

export * from './types'
