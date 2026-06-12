import { z } from 'zod'

const marginField = z
    .number({ message: 'Debe ser un número válido' })
    .positive('Debe ser mayor que 0')
    .max(99.99, 'No puede superar 99.99')
    .optional()

/**
 * Validación de márgenes del POS. Cuando está activo: al menos 1 margen y orden
 * ascendente estricto entre los presentes.
 */
export const posMarginsSchema = z
    .object({
        enabled: z.boolean(),
        margin1: marginField,
        margin2: marginField,
        margin3: marginField
    })
    .superRefine((data, ctx) => {
        if (!data.enabled) return
        const list = [data.margin1, data.margin2, data.margin3].filter(
            (n): n is number => typeof n === 'number'
        )
        if (list.length < 1) {
            ctx.addIssue({
                code: 'custom',
                path: ['margin1'],
                message: 'Define al menos un margen cuando la validación está activa'
            })
            return
        }
        const inputs = [data.margin1, data.margin2, data.margin3]
        for (let i = 1; i < inputs.length; i++) {
            const prev = inputs[i - 1]
            const curr = inputs[i]
            if (typeof curr === 'number' && typeof prev === 'number' && curr <= prev) {
                ctx.addIssue({
                    code: 'custom',
                    path: [`margin${i + 1}`],
                    message: 'Cada margen debe ser mayor que el anterior'
                })
            }
        }
    })
export type PosMarginsFormData = z.infer<typeof posMarginsSchema>
