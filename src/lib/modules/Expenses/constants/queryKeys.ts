import type { ExpenseListParams } from '$lib/api/requests/expenses'

/**
 * Query keys del módulo de gastos variables. Espeja las keys de placepos
 * (`expenses` / `expense-payment-methods`) pero con `list(params)` para que
 * svelte-query refetchee al cambiar filtros. Recuerda envolver los params en
 * un getter / $derived / toStore al pasarlos a createQuery, o no refetchea.
 */
export const EXPENSE_KEYS = {
    list: (params: ExpenseListParams = {}) => ['expenses', 'list', params] as const,
    paymentMethods: ['expense-payment-methods'] as const
}

/**
 * Query keys del módulo de gastos fijos. Espeja las keys de placepos
 * (`fixed-expenses` / `fixed-expense`).
 */
export const FIXED_EXPENSE_KEYS = {
    list: ['fixed-expenses', 'list'] as const,
    byId: (id: number | null | undefined) => ['fixed-expense', id] as const,
    periods: (id: number | null | undefined) => ['fixed-expense', id, 'periods'] as const
}
