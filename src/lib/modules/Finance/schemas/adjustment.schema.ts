import { z } from 'zod'

export const MOVEMENT_TYPE = {
    INCOME: 'INCOME',
    EXPENSE: 'EXPENSE'
} as const

export type AdjustmentMovementType = (typeof MOVEMENT_TYPE)[keyof typeof MOVEMENT_TYPE]

export const DESCRIPTION_MAX = 280

export const adjustmentSchema = z.object({
    movement_type: z.enum([MOVEMENT_TYPE.INCOME, MOVEMENT_TYPE.EXPENSE], {
        message: 'Selecciona el tipo de ajuste'
    }),
    amount: z.number({ message: 'Ingresa un monto válido' }).positive('El monto debe ser mayor a 0'),
    description: z
        .string()
        .trim()
        .min(1, 'Documenta el motivo del ajuste')
        .max(DESCRIPTION_MAX, `Máximo ${DESCRIPTION_MAX} caracteres`)
})

export type AdjustmentFormData = z.infer<typeof adjustmentSchema>

export const adjustmentDefaults = (): AdjustmentFormData => ({
    movement_type: MOVEMENT_TYPE.INCOME,
    amount: 0,
    description: ''
})
