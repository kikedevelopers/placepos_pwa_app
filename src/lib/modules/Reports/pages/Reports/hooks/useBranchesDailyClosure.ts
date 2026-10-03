import { createQuery } from '@tanstack/svelte-query'
import { getBranchesDailyClosure } from '$lib/api/requests/reports'

/**
 * Resumen del día consolidado por sucursal (admin del negocio principal). El
 * endpoint es owner/admin + principal-only; `enabled` evita pedirlo cuando el
 * gate del front no se cumple.
 */
export const useBranchesDailyClosure = (date: string, enabled: boolean) =>
    createQuery({
        queryKey: ['reports', 'branches-daily-closure', date],
        queryFn: () => getBranchesDailyClosure(date),
        enabled
    })
