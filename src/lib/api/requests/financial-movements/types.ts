import type { ApiPayload } from '$lib/api/requests/dashboard/types'

/** Tipo de cuenta sobre la que se consultan movimientos. Espeja pos_api. */
export type AccountType = 'bank' | 'wallet' | 'cash_register' | 'external'

/** Tipo de movimiento financiero. INCOME/TRANSFER suman, EXPENSE resta. */
export type MovementType = 'INCOME' | 'EXPENSE' | 'TRANSFER'

/**
 * Movimiento financiero de una cuenta (billetera/banco/caja). Réplica del
 * `FinancialMovementResponseDto` de pos_api.
 */
export type FinancialMovement = {
    id: number
    amount: number
    movement_type: MovementType
    concept: string
    description: string | null
    source_type: AccountType | null
    source_id: number | null
    destination_type: AccountType | null
    destination_id: number | null
    reference_code: string | null
    created_by: string | null
    created_by_id: number | null
    created_at: string
}

/**
 * Payload de corrección de saldo (`POST /wallets|banks/:id/adjustments`).
 * `amount` va como número (el DTO cloud lo valida con hasta 2 decimales).
 */
export type AdjustmentPayload = {
    movement_type: 'INCOME' | 'EXPENSE'
    amount: number
    description: string
}

export type AdjustmentMovement = {
    id: number
    movement_type: MovementType
    amount: number
    concept: string
    description: string | null
    created_at: string
}

export type GetMovementsResponse = ApiPayload<FinancialMovement[]>
