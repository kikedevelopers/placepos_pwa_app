import { toStore } from 'svelte/store'
import { createQuery } from '@tanstack/svelte-query'
import { getTodayByCashier } from '$lib/api/requests/dashboard'

// `date` es un getter para reaccionar al selector de fecha de la vista.
export const useTodayByCashier = (date: () => string) =>
    createQuery(
        toStore(() => ({
            queryKey: ['reports', 'cashiers', date()],
            queryFn: () => getTodayByCashier(date())
        }))
    )
