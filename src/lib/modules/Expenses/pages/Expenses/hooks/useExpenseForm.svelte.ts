import { fromStore } from 'svelte/store'
import type { ZodError } from 'zod'
import type { CreateExpensePayload } from '$lib/api/requests/expenses'
import { getErrorMessage } from '$lib/utils/errors'
import { roundTo } from '$lib/utils/numbers'
import { expenseSchema, splitSourceKey, type ExpenseFormData } from '../schemas/expense.schema'
import { useExpenseMutations } from './useExpenseMutations'

const toDefaults = (): ExpenseFormData => ({
    source_key: '',
    amount: 0,
    description: ''
})

/** Aplana los issues de zod a un mapa por ruta (primer mensaje por campo). */
const buildErrors = (error: ZodError): Record<string, string> => {
    const map: Record<string, string> = {}
    for (const issue of error.issues) {
        const key = issue.path.join('.')
        if (!(key in map)) map[key] = issue.message
    }
    return map
}

/**
 * Controlador del formulario de gasto variable con runes (mismo patrón que
 * `useProductForm` / `useCustomerForm`): `$state` + `attempted` + `safeParse`,
 * validación en vivo tras el primer intento de envío.
 *
 * Solo CREA (los gastos variables no se editan: para corregir monto/fuente se
 * anula y se recrea). El monto se acota a 2 decimales (numeric(15,2)) antes de
 * enviar.
 */
export function useExpenseForm(onSuccess: () => void) {
    const { create } = useExpenseMutations()
    const c = fromStore(create)

    const form = $state<ExpenseFormData>(toDefaults())
    let attempted = $state(false)
    let submitError = $state('')

    const validation = $derived(expenseSchema.safeParse($state.snapshot(form)))
    const errors = $derived(attempted && !validation.success ? buildErrors(validation.error) : {})

    const submit = () => {
        attempted = true
        submitError = ''
        if (!validation.success) return
        const data = validation.data

        const { source_type, source_id } = splitSourceKey(data.source_key)

        const payload: CreateExpensePayload = {
            description: data.description.trim(),
            amount: roundTo(data.amount, 2),
            source_type,
            source_id
        }

        c.current.mutate(payload, {
            onSuccess,
            onError: (error: unknown) =>
                (submitError = getErrorMessage(error) ?? 'No se pudo registrar el gasto.')
        })
    }

    return {
        form,
        get errors() {
            return errors
        },
        submit,
        get isSubmitting() {
            return c.current.isPending
        },
        get submitError() {
            return submitError
        }
    }
}
