import { toStore } from 'svelte/store'
import { createQuery } from '@tanstack/svelte-query'
import { getExtendedSummary, type ExtendedSummaryParams } from '$lib/api/requests/reports'

export const useExtendedSummary = (params: () => ExtendedSummaryParams) =>
    createQuery(
        toStore(() => ({
            queryKey: ['reports', 'extended-summary', params()],
            queryFn: () => getExtendedSummary(params())
        }))
    )
