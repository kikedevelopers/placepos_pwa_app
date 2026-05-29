import { createMutation } from '@tanstack/svelte-query'
import { goto } from '$app/navigation'
import { login } from '$lib/api/requests/authentication'
import { setAuthToken } from '$lib/api/storage'
import { auth } from '$lib/stores/auth.svelte'

export const useLoginMutation = () =>
    createMutation({
        mutationFn: login,
        onSuccess: async (data) => {
            const accessToken = data?.payload?.access_token
            if (!accessToken) return
            await setAuthToken(accessToken)
            auth.setToken(accessToken)
            if (data.payload?.user) auth.setUser(data.payload.user)
            goto('/', { replaceState: true })
        }
    })
