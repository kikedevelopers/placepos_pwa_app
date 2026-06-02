import { fromStore } from 'svelte/store'
import type { ZodError } from 'zod'
import type { FixedExpense } from '$lib/api/requests/fixedExpenses'
import { getErrorMessage } from '$lib/utils/errors'
import { formatLocalYmd, parseLocalYmd } from '$lib/modules/Expenses/utils/localDate'
import {
    buildDefaultValues,
    fixedExpenseSchema,
    type FixedExpenseFormData
} from '../schemas/fixedExpense.schema'
import { useFixedExpenseMutations } from './useFixedExpenseMutations'

/** Defaults del form a partir del gasto en edición (o vacío en creación). */
const toDefaults = (expense: FixedExpense | null): FixedExpenseFormData => {
    if (!expense) return buildDefaultValues()
    return {
        name: expense.name,
        description: expense.description ?? '',
        amount: expense.amount,
        period_unit: expense.period_unit,
        period_quantity: expense.period_quantity,
        start_date: formatLocalYmd(expense.start_date)
    }
}

/** Aplana los issues de zod a un mapa por ruta (primer mensaje por clave). */
const buildErrors = (error: ZodError): Record<string, string> => {
    const map: Record<string, string> = {}
    for (const issue of error.issues) {
        const key = issue.path.join('.')
        if (!(key in map)) map[key] = issue.message
    }
    return map
}

/**
 * Controlador del formulario de gasto fijo con runes (equivalente al hook
 * react-hook-form + zodResolver de placepos). Valida en vivo tras el primer
 * intento de envío. Las fechas del input `type="date"` se mandan al backend
 * como ISO al mediodía local (vía parseLocalYmd) para evitar el bug de
 * retroceso de día por UTC.
 */
export function useFixedExpenseForm(expense: FixedExpense | null, onSuccess: () => void) {
    const { create, update } = useFixedExpenseMutations()
    const c = fromStore(create)
    const u = fromStore(update)

    const form = $state<FixedExpenseFormData>(toDefaults(expense))
    let attempted = $state(false)
    let submitError = $state('')
    const isEdit = !!expense

    const validation = $derived(fixedExpenseSchema.safeParse($state.snapshot(form)))
    const errors = $derived(attempted && !validation.success ? buildErrors(validation.error) : {})

    const submit = () => {
        attempted = true
        submitError = ''
        if (!validation.success) return
        const data = validation.data

        const handlers = {
            onSuccess,
            onError: (error: unknown) =>
                (submitError = getErrorMessage(error) ?? 'No se pudo guardar el gasto fijo.')
        }

        if (isEdit && expense) {
            u.current.mutate(
                {
                    id: expense.id,
                    payload: {
                        name: data.name.trim(),
                        description: data.description.trim() || null,
                        amount: data.amount,
                        period_unit: data.period_unit,
                        period_quantity: data.period_quantity,
                        start_date: parseLocalYmd(data.start_date).toISOString()
                    }
                },
                handlers
            )
        } else {
            c.current.mutate(
                {
                    name: data.name.trim(),
                    description: data.description?.trim() || null,
                    amount: data.amount,
                    period_unit: data.period_unit,
                    period_quantity: data.period_quantity,
                    start_date: parseLocalYmd(data.start_date).toISOString()
                },
                handlers
            )
        }
    }

    return {
        form,
        get errors() {
            return errors
        },
        submit,
        isEdit,
        get isSubmitting() {
            return c.current.isPending || u.current.isPending
        },
        get submitError() {
            return submitError
        }
    }
}
