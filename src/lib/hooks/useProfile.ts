import { createQuery } from '@tanstack/svelte-query'
import { getProfile } from '$lib/api/requests/authentication'

export const PROFILE_QUERY_KEY = ['auth', 'profile'] as const

/** Debe llamarse durante la inicialización de un componente (como en pos_app). */
export const useProfile = () =>
    createQuery({
        queryKey: PROFILE_QUERY_KEY,
        queryFn: getProfile
    })
