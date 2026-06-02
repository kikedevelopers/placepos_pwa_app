// Paridad con el contrato pos_api (modules/expenses). Multi-tenant: el
// `company_id` NUNCA viaja en payloads/queries — se resuelve del JWT. Amounts
// son numeric(15,2) serializados a number; las fechas a ISO string.

/** Origen del que se debita un gasto. Espejo `ExpenseSourceType` de pos_api. */
export type ExpenseSourceType = 'bank' | 'wallet' | 'cash_register'

/** Categorías canónicas del gasto. El backend acepta otras (forward-compatible). */
export type ExpenseCategory = 'SUPPLIES' | 'RENT' | 'UTILITIES' | 'SALARY' | 'OTHER'

/**
 * Fuentes de pago disponibles para registrar un gasto
 * (`GET /expenses/payment-methods`). Cada item lleva su `balance` para que la
 * UI pueda deshabilitar fuentes sin saldo. `cash_registers` es la caja abierta
 * del actor (0 o 1 item) y NO trae `name`.
 */
export type PaymentMethodWallet = {
    id: number
    name: string
    balance: number
}

export type PaymentMethodBank = {
    id: number
    name: string
    account_number: string
    balance: number
}

export type PaymentMethodCashRegister = {
    id: number
    balance: number
}

export type PaymentMethodsResponse = {
    wallets: PaymentMethodWallet[]
    banks: PaymentMethodBank[]
    cash_registers: PaymentMethodCashRegister[]
}

/** Row de gasto expuesto al cliente. Espejo `ExpenseResponseDto`. */
export type ExpenseRecord = {
    id: number
    description: string
    amount: number
    category: string | null
    source_type: ExpenseSourceType
    source_id: number
    source_name: string | null
    expense_date: string
    notes: string | null
    is_archived: boolean
    created_by: string | null
    created_by_id: number | null
    created_at: string
    updated_at: string
}

/** Payload de `GET /expenses`. Espejo `ListExpensesResponseDto`. */
export type ExpenseListResponse = {
    expenses: ExpenseRecord[]
    total: number
    totalAmount: number
    activeCount: number
    limit: number
    offset: number
}

/** Payload de `POST /expenses`. Espejo `CreateExpenseDto`. */
export type CreateExpensePayload = {
    description: string
    amount: number
    source_type: ExpenseSourceType
    source_id: number
    category?: string
    expense_date?: string
    notes?: string | null
}

/**
 * Payload de `PUT /expenses/:id`. SOLO metadata editable. Para cambiar
 * amount/source/expense_date hay que anular (void) y recrear. Espejo
 * `UpdateExpenseDto`.
 */
export type UpdateExpensePayload = {
    description?: string
    category?: string | null
    notes?: string | null
}

/** Query de `GET /expenses`. Espejo `ListExpensesQueryDto`. */
export type ExpenseListParams = {
    search?: string
    date_from?: string
    date_to?: string
    category?: string
    source_type?: ExpenseSourceType
    source_id?: number
    includeArchived?: boolean
    limit?: number
    offset?: number
}
