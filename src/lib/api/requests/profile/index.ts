import api from '$lib/api/config'
import type { ApiPayload } from '$lib/api/requests/dashboard/types'

/** Cuenta del owner (espejo de `/users/me` en pos_api). */
export type OwnerProfile = {
    id: number
    name: string
    lastname: string
    email: string
    type: string
    created_at: string
    updated_at: string
}

export type UpdateMePayload = {
    name?: string
    lastname?: string
    email?: string
}

export type ChangePasswordPayload = {
    current_password: string
    new_password: string
    confirm_password: string
}

/** Actualiza nombre/apellido/correo del owner. Email único global (409 si choca). */
export const updateMe = async (payload: UpdateMePayload): Promise<OwnerProfile> => {
    const response = await api.put<ApiPayload<OwnerProfile>>('/users/me', payload)
    return response.data.payload
}

/** Cambia la contraseña del owner. */
export const changePassword = async (
    payload: ChangePasswordPayload
): Promise<{ updated: boolean }> => {
    const response = await api.put<ApiPayload<{ updated: boolean }>>('/users/me/password', payload)
    return response.data.payload
}
