import { createMutation, useQueryClient } from '@tanstack/svelte-query'
import {
    archiveFixedExpense,
    createFixedExpense,
    updateFixedExpense,
    type CreateFixedExpensePayload,
    type UpdateFixedExpensePayload
} from '$lib/api/requests/fixedExpenses'
import { FIXED_EXPENSE_KEYS } from '$lib/modules/Expenses/constants/queryKeys'

/**
 * Mutaciones de gastos fijos (create / update / archive). Tras cualquier
 * cambio se invalida la lista para refrescar montos y stats de cortes
 * pendientes. En edición/archivo también se invalida el detalle por id.
 */
export const useFixedExpenseMutations = () => {
    const queryClient = useQueryClient()

    const invalidateList = () =>
        queryClient.invalidateQueries({ queryKey: FIXED_EXPENSE_KEYS.list })

    const invalidateById = (id: number) =>
        queryClient.invalidateQueries({ queryKey: FIXED_EXPENSE_KEYS.byId(id) })

    const create = createMutation({
        mutationFn: (payload: CreateFixedExpensePayload) => createFixedExpense(payload),
        onSuccess: invalidateList
    })

    const update = createMutation({
        mutationFn: ({ id, payload }: { id: number; payload: UpdateFixedExpensePayload }) =>
            updateFixedExpense(id, payload),
        onSuccess: (_data, { id }) => {
            invalidateList()
            invalidateById(id)
        }
    })

    const archive = createMutation({
        mutationFn: (id: number) => archiveFixedExpense(id),
        onSuccess: (_data, id) => {
            invalidateList()
            invalidateById(id)
        }
    })

    return { create, update, archive }
}
