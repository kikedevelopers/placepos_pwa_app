import { toStore } from 'svelte/store'
import { createQuery } from '@tanstack/svelte-query'
import { getDailyClosure } from '$lib/api/requests/reports'
import { getTodaySummary } from '$lib/api/requests/dashboard'

/** Cierre del día elegido (reactivo a la fecha). */
export const useDayClosure = (date: () => string) =>
    createQuery(
        toStore(() => ({
            queryKey: ['reports', 'daily-closure', date()],
            queryFn: () => getDailyClosure(date())
        }))
    )

/** /dashboard/today del día elegido: de aquí salen los abonos a compras. */
export const useDaySummary = (date: () => string) =>
    createQuery(
        toStore(() => ({
            queryKey: ['reports', 'daily-closure', 'day-summary', date()],
            queryFn: () => getTodaySummary(date())
        }))
    )
