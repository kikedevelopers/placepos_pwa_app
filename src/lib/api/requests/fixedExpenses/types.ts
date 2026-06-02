// Paridad con el contrato pos_api (modules/fixed-expenses). Multi-tenant: el
// `company_id` NUNCA viaja en payloads — se resuelve del JWT. Amounts son
// numeric(15,2) serializados a number; fechas a ISO string.

/** Unidad de periodicidad del gasto fijo. Espejo `FixedExpensePeriodUnit`. */
export type FixedExpensePeriodUnit = 'hour' | 'day' | 'week' | 'month'

/** Estado de un corte (period). Espejo `FixedExpensePeriodStatus`. */
export type FixedExpensePeriodStatus = 'PENDING' | 'PAID'

/** Fuente de pago de un corte. Espejo `FixedExpensePaySource`. */
export type FixedExpensePaySource = 'wallet' | 'bank' | 'cash_register'

/** Row de gasto fijo expuesto al cliente. Espejo `FixedExpenseResponseDto`. */
export type FixedExpense = {
    id: number
    name: string
    description: string | null
    amount: number
    period_unit: FixedExpensePeriodUnit
    period_quantity: number
    start_date: string
    is_archived: boolean
    created_by: string
    created_by_id: number | null
    created_at: string
    updated_at: string
    /** Número de cortes vencidos sin pagar (status=PENDING). */
    pending_periods_count: number
    /** Suma de los montos de los cortes pendientes. */
    pending_periods_total: number
}

/** Corte (period) de un gasto fijo. Espejo `FixedExpensePeriodResponseDto`. */
export type FixedExpensePeriod = {
    id: number
    fixed_expense_id: number
    period_number: number
    due_at: string
    amount: number
    status: FixedExpensePeriodStatus
    alert_id: number | null
    paid_at: string | null
    paid_by_id: number | null
    /** `Expense` materializado al marcar el corte como PAID. */
    expense_id: number | null
    created_at: string
    updated_at: string
}

/** Payload de `POST /fixed-expenses`. Espejo `CreateFixedExpenseDto`. */
export type CreateFixedExpensePayload = {
    name: string
    description?: string | null
    amount: number
    period_unit: FixedExpensePeriodUnit
    period_quantity: number
    start_date: string
}

/** Payload de `PUT /fixed-expenses/:id`. Espejo `UpdateFixedExpenseDto`. */
export type UpdateFixedExpensePayload = {
    name?: string
    description?: string | null
    amount?: number
    period_unit?: FixedExpensePeriodUnit
    period_quantity?: number
    start_date?: string
}

/**
 * Payload de `PUT /fixed-expenses/:id/periods/:periodId/pay`. Para
 * `cash_register` el backend ignora `source_id` y resuelve la caja del actor.
 * Espejo `PayFixedExpensePeriodDto`.
 */
export type PayFixedExpensePeriodPayload = {
    source_type: FixedExpensePaySource
    source_id: number
}
