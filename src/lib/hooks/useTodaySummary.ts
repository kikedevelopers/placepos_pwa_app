import { createQuery } from '@tanstack/svelte-query'
import { getTodaySummary } from '$lib/api/requests/dashboard'

export const TODAY_QUERY_KEY = ['dashboard', 'today'] as const

export const useTodaySummary = () =>
    createQuery({
        queryKey: TODAY_QUERY_KEY,
        queryFn: getTodaySummary,
        // Se detiene el polling si la última carga falló (no reintentar 4xx en bucle).
        refetchInterval: (query) => (query.state.status === 'error' ? false : 60_000)
    })
