import api from '$lib/api/config'
import type { ApiPayload } from '$lib/api/requests/dashboard/types'
import type {
    CreateWalletPayload,
    UpdateWalletPayload,
    WalletAccount,
    WalletAdjustmentPayload,
    WalletAdjustmentResult
} from './types'

/** Lista las billeteras activas de la company. */
export const getWallets = async (): Promise<WalletAccount[]> => {
    const response = await api.get<ApiPayload<WalletAccount[]>>('/wallets')
    return response.data.payload
}

/** Crea una billetera. Si `initial_balance > 0`, el backend genera el movimiento INITIAL_BALANCE. */
export const createWallet = async (payload: CreateWalletPayload): Promise<WalletAccount> => {
    const response = await api.post<ApiPayload<WalletAccount>>('/wallets', payload)
    return response.data.payload
}

/** Renombra una billetera. */
export const updateWallet = async (
    id: number,
    payload: UpdateWalletPayload
): Promise<WalletAccount> => {
    const response = await api.put<ApiPayload<WalletAccount>>(`/wallets/${id}`, payload)
    return response.data.payload
}

/** Corrección manual de saldo (solo owner). Genera un movimiento ADJUSTMENT. */
export const adjustWallet = async (
    id: number,
    payload: WalletAdjustmentPayload
): Promise<WalletAdjustmentResult> => {
    const response = await api.post<ApiPayload<WalletAdjustmentResult>>(
        `/wallets/${id}/adjustments`,
        payload
    )
    return response.data.payload
}

export * from './types'
