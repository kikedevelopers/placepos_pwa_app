import { get } from 'svelte/store'
import { loginSchema, type LoginFormData } from '../schemas/login.schema'
import { useLoginMutation } from './useLoginMutation'

type LoginErrorField = 'user' | 'password' | null

export type LoginError = {
    type: LoginErrorField
    message: string
}

// El interceptor de axios (api/config.ts) aplana el error a
// { status, success, error, payload? }. No existe err.response aquí.
type ApiError = {
    status?: number
    error?: string
    message?: string
    payload?: { code?: string; details?: unknown }
}

// Códigos por campo del contrato PlacePos (compat). pos_api es anti-enumeración:
// devuelve 401 "Credenciales inválidas" sin código, que se muestra como banner.
const FIELD_BY_CODE: Record<string, LoginError> = {
    USER_NOT_FOUND: { type: 'user', message: 'No existe una cuenta con ese correo o usuario' },
    INVALID_PASSWORD: { type: 'password', message: 'La contraseña ingresada es incorrecta' },
    LOGIN_DISABLED: { type: 'user', message: 'Este usuario no está habilitado para iniciar sesión' }
}

const resolveError = (raw: unknown): LoginError => {
    const err = raw as ApiError
    const message = err.error ?? err.message ?? ''
    const mapped = (err.payload?.code && FIELD_BY_CODE[err.payload.code]) || FIELD_BY_CODE[message]
    if (mapped) return mapped
    return { type: null, message: message || 'Ocurrió un error al iniciar sesión' }
}

/**
 * Controlador del formulario de login con runes (equivalente al hook
 * react-hook-form + zodResolver de pos_app). `mutation` es el store de
 * svelte-query; el componente lee `$mutation.isPending` para el estado de carga.
 */
export function useLoginForm() {
    const form = $state<LoginFormData>({ username: '', password: '' })
    const errors = $state<{ username?: string; password?: string }>({})
    const loginError = $state<LoginError>({ type: null, message: '' })
    const mutation = useLoginMutation()

    const clearError = () => {
        loginError.type = null
        loginError.message = ''
    }

    const onSubmit = (event?: Event) => {
        event?.preventDefault()
        clearError()

        const parsed = loginSchema.safeParse(form)
        if (!parsed.success) {
            const fieldErrors = parsed.error.flatten().fieldErrors
            errors.username = fieldErrors.username?.[0]
            errors.password = fieldErrors.password?.[0]
            return
        }
        errors.username = undefined
        errors.password = undefined

        get(mutation).mutate(parsed.data, {
            onError: (error) => {
                const resolved = resolveError(error)
                loginError.type = resolved.type
                loginError.message = resolved.message
            }
        })
    }

    return { form, errors, loginError, mutation, clearError, onSubmit }
}
