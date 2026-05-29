import { createQuery } from '@tanstack/svelte-query'
import { getDailyClosure } from '$lib/api/requests/reports'

export const useDailyClosure = (date: string) =>
    createQuery({
        queryKey: ['reports', 'daily-closure', date],
        queryFn: () => getDailyClosure(date)
    })
