import { toStore } from 'svelte/store'
import { createQuery } from '@tanstack/svelte-query'
import { getSalesByHour } from '$lib/api/requests/reports'

/** Venta por hora de un día (comparte prefijo de caché con el cierre). */
export const useSalesByHour = (date: () => string) =>
    createQuery(
        toStore(() => ({
            queryKey: ['reports', 'daily-closure', 'sales-by-hour', date()],
            queryFn: () => getSalesByHour(date())
        }))
    )
