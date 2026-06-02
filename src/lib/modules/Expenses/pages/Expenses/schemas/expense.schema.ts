import { z } from 'zod'
import type { ExpenseSourceType } from '$lib/api/requests/expenses'

/**
 * Schema del gasto variable (crear). Espeja las validaciones de placepos
 * (`VariableExpenses.handleSubmit`): medio de pago requerido, monto > 0 y
 * descripción obligatoria. El medio de pago se modela como `source_key`
 * (`"<type>-<id>"`) — la misma convención que el `PaymentMethodDropdown` del
 * desktop — y se descompone en `source_type` / `source_id` al enviar.
 *
 * `amount` es numeric(15,2): se valida > 0 y se acota a 2 decimales en el form.
 * Para corregir monto/fuente NO se edita (void + recrear); por eso el schema de
 * edición no existe aquí (la edición solo toca metadata vía UpdateExpensePayload).
 */
export const expenseSchema = z.object({
    source_key: z.string().min(1, 'Selecciona un medio de pago'),
    amount: z
        .number({ message: 'El monto es requerido' })
        .positive('El monto debe ser mayor a 0'),
    description: z
        .string()
        .trim()
        .min(1, 'La descripción del gasto es obligatoria')
        .max(255, 'Máximo 255 caracteres')
})

export type ExpenseFormData = z.infer<typeof expenseSchema>

/** Descompone `source_key` ("wallet-3") en su tipo y id numéricos. */
export const splitSourceKey = (
    key: string
): { source_type: ExpenseSourceType; source_id: number } => {
    const idx = key.lastIndexOf('-')
    const source_type = key.slice(0, idx) as ExpenseSourceType
    const source_id = Number.parseInt(key.slice(idx + 1), 10)
    return { source_type, source_id }
}

/** Construye un `source_key` a partir de tipo + id. */
export const buildSourceKey = (type: ExpenseSourceType, id: number): string => `${type}-${id}`
