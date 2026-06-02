import { z } from 'zod'
import { formatLocalYmd } from '$lib/modules/Expenses/utils/localDate'

/** Valores válidos de periodicidad (espejo de FixedExpensePeriodUnit). */
export const PERIOD_UNIT_VALUES = ['hour', 'day', 'week', 'month'] as const

/**
 * Esquema del formulario de gasto fijo. Paridad con placepos:
 * name 1-120, amount>0, period_unit enum, period_quantity int>0, start_date.
 */
export const fixedExpenseSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, 'El nombre del gasto es requerido')
        .max(120, 'Máximo 120 caracteres'),
    description: z.string().trim().max(500, 'Máximo 500 caracteres'),
    amount: z
        .number({ message: 'El monto es requerido' })
        .positive('El monto debe ser mayor a 0'),
    period_unit: z.enum([...PERIOD_UNIT_VALUES], { message: 'Selecciona una unidad' }),
    period_quantity: z
        .number({ message: 'La cantidad es requerida' })
        .int('Debe ser un número entero')
        .positive('Debe ser mayor a 0'),
    start_date: z
        .string()
        .min(1, 'La fecha de inicio es requerida')
        .refine((value) => !Number.isNaN(Date.parse(value)), 'Fecha inválida')
})

export type FixedExpenseFormData = z.infer<typeof fixedExpenseSchema>

/** Valores por defecto: mensual, hoy, vacíos. */
export const buildDefaultValues = (): FixedExpenseFormData => ({
    name: '',
    description: '',
    amount: 0,
    period_unit: 'month',
    period_quantity: 1,
    start_date: formatLocalYmd(new Date())
})
