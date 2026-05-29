import { z } from 'zod'

const noSpacesRegex = /^\S+$/

export const loginSchema = z.object({
    username: z
        .string()
        .trim()
        .min(1, 'El usuario es requerido')
        .refine((value) => noSpacesRegex.test(value), 'El usuario no puede contener espacios'),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres')
})

export type LoginFormData = z.infer<typeof loginSchema>
