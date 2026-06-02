import { z } from 'zod'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Campos como strings simples (el vacío es válido); las reglas condicionales
// (NIT requerido en empresa, email válido) van en superRefine. Sin `.default()`
// para que el tipo de entrada y salida del schema coincidan.
export const customerSchema = z
    .object({
        person_type: z.enum(['INDIVIDUAL', 'COMPANY']),
        name: z
            .string()
            .trim()
            .min(1, 'El nombre es requerido')
            .max(200, 'Máximo 200 caracteres'),
        doc_number: z.string().trim().max(30, 'Máximo 30 caracteres'),
        phone: z.string().trim().max(30, 'Máximo 30 caracteres'),
        email: z.string().trim().max(255, 'Máximo 255 caracteres'),
        address: z.string().trim().max(500, 'Máximo 500 caracteres')
    })
    .superRefine((data, ctx) => {
        if (data.person_type === 'COMPANY' && !data.doc_number) {
            ctx.addIssue({ code: 'custom', path: ['doc_number'], message: 'El NIT es requerido' })
        }
        if (data.email && !EMAIL_REGEX.test(data.email)) {
            ctx.addIssue({
                code: 'custom',
                path: ['email'],
                message: 'Correo electrónico inválido'
            })
        }
    })

export type CustomerFormData = z.infer<typeof customerSchema>
