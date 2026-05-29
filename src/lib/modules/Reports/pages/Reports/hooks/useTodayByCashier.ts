import { createQuery } from '@tanstack/svelte-query'
import { getTodayByCashier } from '$lib/api/requests/dashboard'

export const useTodayByCashier = (date: string) =>
    createQuery({
        queryKey: ['reports', 'cashiers', date],
        queryFn: () => getTodayByCashier(date)
    })
