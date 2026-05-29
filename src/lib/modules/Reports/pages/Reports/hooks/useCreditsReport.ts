import { toStore } from 'svelte/store'
import { createQuery } from '@tanstack/svelte-query'
import { getCreditsReport, type CreditsReportParams } from '$lib/api/requests/reports'

export const useCreditsReport = (params: () => CreditsReportParams) =>
    createQuery(
        toStore(() => ({
            queryKey: ['reports', 'credits', params()],
            queryFn: () => getCreditsReport(params())
        }))
    )
