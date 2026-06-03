import { toStore } from 'svelte/store'
import { createQuery } from '@tanstack/svelte-query'
import { getComparativeReport, type ComparativeReportParams } from '$lib/api/requests/reports'

export const useComparativeReport = (params: () => ComparativeReportParams) =>
    createQuery(
        toStore(() => ({
            queryKey: ['reports', 'comparative', params()],
            queryFn: () => getComparativeReport(params())
        }))
    )
