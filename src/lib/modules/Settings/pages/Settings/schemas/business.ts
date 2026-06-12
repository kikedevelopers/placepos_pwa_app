import { z } from 'zod'

const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i

/** Datos del negocio (CompanyForm). Email opcional pero validado si se escribe. */
export const companySchema = z.object({
    name: z.string().trim().min(1, 'El nombre es obligatorio'),
    document_number: z.string().trim(),
    email: z
        .string()
        .trim()
        .refine((v) => v === '' || EMAIL_REGEX.test(v), { message: 'Correo electrónico inválido' }),
    phone_number: z.string().trim(),
    address: z.string().trim()
})
export type CompanyFormData = z.infer<typeof companySchema>

/** Punto de equilibrio (AdminInfoForm). */
export const adminInfoSchema = z.object({
    break_even_amount: z
        .number({ message: 'El monto es requerido' })
        .min(0, { message: 'Debe ser ≥ 0' }),
    break_even_period_days: z
        .number({ message: 'Los días son requeridos' })
        .int({ message: 'Debe ser un entero' })
        .min(1, { message: 'Mínimo 1 día' })
        .max(30, { message: 'Máximo 30 días' })
})
export type AdminInfoFormData = z.infer<typeof adminInfoSchema>

/**
 * Prefijo de consecutivo. Mayúsculas, números y guiones; 2–32 chars; sin guión
 * al inicio/fin ni guiones consecutivos.
 */
const PREFIX_REGEX = /^[A-Z0-9]+(-[A-Z0-9]+)*$/
export const prefixSchema = z
    .string()
    .trim()
    .min(2, 'Debe tener al menos 2 caracteres')
    .max(32, 'No puede superar 32 caracteres')
    .transform((value) => value.toUpperCase())
    .refine((v) => /^[A-Z0-9-]+$/.test(v), {
        message: 'Solo letras mayúsculas, números y guiones'
    })
    .refine((v) => !v.startsWith('-') && !v.endsWith('-'), {
        message: 'No puede iniciar ni terminar con guión'
    })
    .refine((v) => PREFIX_REGEX.test(v), { message: 'No se permiten guiones consecutivos' })
