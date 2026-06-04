import type { AdjustmentMovement, AdjustmentPayload } from '$lib/api/requests/financial-movements/types'

export type BankAccountType = 'savings' | 'checking'

/** Cuenta bancaria. Réplica del `BankResponseDto` de pos_api. */
export type BankAccount = {
    id: number
    name: string
    account_number: string
    account_type: BankAccountType
    balance: number
    available_in_pos: boolean
    created_by: string | null
    created_at: string
    updated_at: string
}

/**
 * Alta de cuenta bancaria. `initial_balance` viaja como string decimal
 * (contrato cloud); se omite cuando es 0.
 */
export type CreateBankPayload = {
    name: string
    account_number: string
    account_type: BankAccountType
    initial_balance?: string
    available_in_pos: boolean
}

export type UpdateBankPayload = {
    name: string
    account_number: string
    account_type: BankAccountType
    available_in_pos: boolean
}

export type BankAdjustmentPayload = AdjustmentPayload

export type BankAdjustmentResult = {
    bank: BankAccount
    movement: AdjustmentMovement
}
