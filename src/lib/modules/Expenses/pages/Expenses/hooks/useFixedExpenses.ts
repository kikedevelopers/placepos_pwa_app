import { createQuery } from '@tanstack/svelte-query'
import { getFixedExpenses } from '$lib/api/requests/fixedExpenses'
import { FIXED_EXPENSE_KEYS } from '$lib/modules/Expenses/constants/queryKeys'

/**
 * Listado de gastos fijos (incluye stats de cortes pendientes por gasto).
 * staleTime de 5 min: el devengo se anima en el cliente vía useLiveTick, no
 * requiere refetch de red para sentirse "vivo".
 */
export const useFixedExpenses = () =>
    createQuery({
        queryKey: FIXED_EXPENSE_KEYS.list,
        queryFn: getFixedExpenses,
        staleTime: 5 * 60_000
    })
