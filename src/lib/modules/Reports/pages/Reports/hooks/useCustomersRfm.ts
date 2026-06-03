import { toStore } from 'svelte/store'
import { createQuery } from '@tanstack/svelte-query'
import { getCustomersRfm, type CustomersRfmParams } from '$lib/api/requests/reports'

export const useCustomersRfm = (params: () => CustomersRfmParams) =>
    createQuery(
        toStore(() => ({
            queryKey: ['reports', 'customers-rfm', params()],
            queryFn: () => getCustomersRfm(params())
        }))
    )
