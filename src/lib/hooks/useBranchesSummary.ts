import { createQuery } from '@tanstack/svelte-query'
import { getBranchesSummary } from '$lib/api/requests/dashboard'

export const BRANCHES_SUMMARY_QUERY_KEY = ['dashboard', 'branches-summary'] as const

/**
 * Resumen consolidado por sucursal (owner multi-sucursal). El endpoint
 * `GET /dashboard/branches-summary` es owner-only; el gating (owner + sucursales
 * habilitadas + ≥1 activa) lo hace el componente que monta el card, así que la
 * query solo corre cuando realmente se muestra.
 */
export const useBranchesSummary = () =>
    createQuery({
        queryKey: BRANCHES_SUMMARY_QUERY_KEY,
        queryFn: () => getBranchesSummary(),
        // Se detiene el polling si la última carga falló (no reintentar 4xx en bucle).
        refetchInterval: (query) => (query.state.status === 'error' ? false : 60_000)
    })
