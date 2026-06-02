import { toStore } from 'svelte/store'
import { createQuery } from '@tanstack/svelte-query'
import { getExpenses, type ExpenseListParams } from '$lib/api/requests/expenses'
import { EXPENSE_KEYS } from '$lib/modules/Expenses/constants/queryKeys'

/**
 * Listado de gastos variables con filtros. `params` es un getter para que las
 * opciones de la query sean reactivas (mismo patrón que `usePurchases`): el
 * `queryKey` incluye los params, así que al cambiar búsqueda/fechas svelte-query
 * refetchea. Si se pasara un objeto plano, la key quedaría congelada y no
 * refrescaría.
 */
export const useExpenses = (params: () => ExpenseListParams) =>
    createQuery(
        toStore(() => ({
            queryKey: EXPENSE_KEYS.list(params()),
            queryFn: () => getExpenses(params())
        }))
    )
