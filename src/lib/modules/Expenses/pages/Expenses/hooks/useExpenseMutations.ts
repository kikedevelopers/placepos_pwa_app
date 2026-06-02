import { createMutation, useQueryClient } from '@tanstack/svelte-query'
import { createExpense, voidExpense, type CreateExpensePayload } from '$lib/api/requests/expenses'
import { EXPENSE_KEYS } from '$lib/modules/Expenses/constants/queryKeys'

/**
 * Mutaciones de gastos variables: crear y anular (void). Tras cualquiera de las
 * dos se invalida la lista (todas sus variantes de params) y los medios de pago,
 * porque ambos mueven el balance de la fuente.
 *
 * - `create` puede devolver 422 (saldo insuficiente) o 404 (cuenta no encontrada).
 * - `void` puede devolver 422 (ya anulado / cuenta archivada / sin caja abierta).
 *
 * El void NO es delete: revierte el balance. La autorización (solo owner) la
 * controla la UI vía `useUserRole().canVoid`; el backend la reimpone.
 */
export const useExpenseMutations = () => {
    const queryClient = useQueryClient()

    const invalidate = () => {
        // Invalida todas las variantes de la lista (prefijo) y los medios de pago.
        queryClient.invalidateQueries({ queryKey: ['expenses', 'list'] })
        queryClient.invalidateQueries({ queryKey: EXPENSE_KEYS.paymentMethods })
    }

    const create = createMutation({
        mutationFn: (payload: CreateExpensePayload) => createExpense(payload),
        onSuccess: invalidate
    })

    const voidExpenseMutation = createMutation({
        mutationFn: (id: number) => voidExpense(id),
        onSuccess: invalidate
    })

    return { create, void: voidExpenseMutation }
}
