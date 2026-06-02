import { createQuery } from '@tanstack/svelte-query'
import { getCustomerAnalytics, getCustomers } from '$lib/api/requests/customers'
import { CUSTOMER_KEYS } from '$lib/modules/Customers/constants/queryKeys'

export const useCustomers = () =>
    createQuery({
        queryKey: CUSTOMER_KEYS.list,
        queryFn: () => getCustomers()
    })

export const useCustomerAnalytics = () =>
    createQuery({
        queryKey: CUSTOMER_KEYS.analytics,
        queryFn: getCustomerAnalytics
    })
