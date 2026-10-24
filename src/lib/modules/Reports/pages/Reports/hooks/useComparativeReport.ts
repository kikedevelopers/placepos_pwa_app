import { toStore } from 'svelte/store'
import { createQuery } from '@tanstack/svelte-query'
import {
    getComparativeDayReport,
    getComparativeReport,
    type ComparativeDayParams,
    type ComparativeReportParams
} from '$lib/api/requests/reports'

export const useComparativeReport = (params: () => ComparativeReportParams) =>
    createQuery(
        toStore(() => ({
            queryKey: ['reports', 'comparative', params()],
            queryFn: () => getComparativeReport(params())
        }))
    )

export const useComparativeDayReport = (params: () => ComparativeDayParams) =>
    createQuery(
        toStore(() => ({
            queryKey: ['reports', 'comparative-day', params()],
            queryFn: () => getComparativeDayReport(params())
        }))
    )
