import { toStore } from 'svelte/store'
import { createQuery } from '@tanstack/svelte-query'
import { getSalesReport, type SalesReportParams } from '$lib/api/requests/reports'

// `params` es un getter para que las opciones sean reactivas a los filtros
// (svelte-query acepta un store de opciones; `toStore` lo crea desde runes).
export const useSalesReport = (params: () => SalesReportParams) =>
    createQuery(
        toStore(() => ({
            queryKey: ['reports', 'sales', params()],
            queryFn: () => getSalesReport(params())
        }))
    )
