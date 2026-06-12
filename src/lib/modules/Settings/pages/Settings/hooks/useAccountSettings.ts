import { createMutation, useQueryClient } from '@tanstack/svelte-query'
import {
    updateMe,
    changePassword,
    type UpdateMePayload,
    type ChangePasswordPayload
} from '$lib/api/requests/profile'
import { PROFILE_QUERY_KEY } from '$lib/hooks/useProfile'

/** Actualiza la cuenta del owner e invalida el perfil (refresca header/menú). */
export const useUpdateMe = () => {
    const queryClient = useQueryClient()
    return createMutation({
        mutationFn: (payload: UpdateMePayload) => updateMe(payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY })
    })
}

export const useChangePassword = () =>
    createMutation({
        mutationFn: (payload: ChangePasswordPayload) => changePassword(payload)
    })
