import { z } from 'zod'

/** Información personal del owner (PersonalInfoForm). */
export const personalInfoSchema = z.object({
    name: z.string().trim().min(1, 'El nombre es obligatorio'),
    lastname: z.string().trim().min(1, 'El apellido es obligatorio'),
    email: z
        .string()
        .trim()
        .min(1, 'El correo es obligatorio')
        .email('El correo electrónico no es válido')
})
export type PersonalInfoFormData = z.infer<typeof personalInfoSchema>

/** Cambio de contraseña (SecurityForm). */
export const securitySchema = z
    .object({
        current_password: z.string().min(1, 'Ingresa tu contraseña actual'),
        new_password: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
        confirm_password: z.string().min(1, 'Confirma la nueva contraseña')
    })
    .refine((d) => d.new_password === d.confirm_password, {
        message: 'Las contraseñas no coinciden',
        path: ['confirm_password']
    })
    .refine((d) => d.new_password !== d.current_password, {
        message: 'La nueva contraseña debe ser distinta a la actual',
        path: ['new_password']
    })
export type SecurityFormData = z.infer<typeof securitySchema>

export const securityDefaults = (): SecurityFormData => ({
    current_password: '',
    new_password: '',
    confirm_password: ''
})
