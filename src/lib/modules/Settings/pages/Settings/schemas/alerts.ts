import { z } from 'zod'

/** Alerta de clientes inactivos. `recurrence_window_days` > `inactivity_days`. */
export const inactiveCustomerSchema = z
    .object({
        is_enabled: z.boolean(),
        inactivity_days: z
            .number({ message: 'Debe ser numérico' })
            .int('Debe ser un entero')
            .min(1, 'Mínimo 1 día'),
        min_purchases: z
            .number({ message: 'Debe ser numérico' })
            .int('Debe ser un entero')
            .min(1, 'Mínimo 1 compra'),
        recurrence_window_days: z
            .number({ message: 'Debe ser numérico' })
            .int('Debe ser un entero')
            .min(1, 'Mínimo 1 día'),
        check_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Formato HH:mm inválido')
    })
    .refine((data) => data.recurrence_window_days > data.inactivity_days, {
        message: 'Debe ser mayor a "Días sin comprar"',
        path: ['recurrence_window_days']
    })
export type InactiveCustomerFormData = z.infer<typeof inactiveCustomerSchema>

export const inactiveCustomerDefaults = (): InactiveCustomerFormData => ({
    is_enabled: false,
    inactivity_days: 30,
    min_purchases: 1,
    recurrence_window_days: 60,
    check_time: '09:00'
})
