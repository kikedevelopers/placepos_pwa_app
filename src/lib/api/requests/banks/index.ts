import api from '$lib/api/config'
import type { ApiPayload } from '$lib/api/requests/dashboard/types'
import type {
    BankAccount,
    BankAdjustmentPayload,
    BankAdjustmentResult,
    CreateBankPayload,
    UpdateBankPayload
} from './types'

/** Lista las cuentas bancarias activas de la company. */
export const getBanks = async (): Promise<BankAccount[]> => {
    const response = await api.get<ApiPayload<BankAccount[]>>('/banks')
    return response.data.payload
}

/** Crea una cuenta bancaria. Si `initial_balance > 0`, genera el movimiento INITIAL_BALANCE. */
export const createBank = async (payload: CreateBankPayload): Promise<BankAccount> => {
    const response = await api.post<ApiPayload<BankAccount>>('/banks', payload)
    return response.data.payload
}

/** Actualiza una cuenta bancaria (nombre, número, tipo, disponibilidad en POS). */
export const updateBank = async (
    id: number,
    payload: UpdateBankPayload
): Promise<BankAccount> => {
    const response = await api.put<ApiPayload<BankAccount>>(`/banks/${id}`, payload)
    return response.data.payload
}

/** Corrección manual de saldo (solo owner). Genera un movimiento ADJUSTMENT. */
export const adjustBank = async (
    id: number,
    payload: BankAdjustmentPayload
): Promise<BankAdjustmentResult> => {
    const response = await api.post<ApiPayload<BankAdjustmentResult>>(
        `/banks/${id}/adjustments`,
        payload
    )
    return response.data.payload
}

export * from './types'
