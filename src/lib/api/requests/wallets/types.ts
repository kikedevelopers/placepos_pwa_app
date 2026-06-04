import type { AdjustmentMovement, AdjustmentPayload } from '$lib/api/requests/financial-movements/types'

/** Billetera / caja. Réplica del `WalletResponseDto` de pos_api. */
export type WalletAccount = {
    id: number
    name: string
    balance: number
    created_by: string | null
    created_at: string
}

/**
 * Alta de billetera. `initial_balance` viaja como string decimal (contrato
 * cloud, skill financial-precision); se omite cuando es 0.
 */
export type CreateWalletPayload = {
    name: string
    initial_balance?: string
}

export type UpdateWalletPayload = {
    name: string
}

export type WalletAdjustmentPayload = AdjustmentPayload

export type WalletAdjustmentResult = {
    wallet: WalletAccount
    movement: AdjustmentMovement
}
