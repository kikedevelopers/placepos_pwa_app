import { createQuery } from '@tanstack/svelte-query'
import { getCustomerCategories } from '$lib/api/requests/customerCategories'
import { CUSTOMER_CATEGORY_KEYS } from '$lib/modules/CustomerCategories/constants/queryKeys'

export const useCustomerCategories = () =>
    createQuery({
        queryKey: CUSTOMER_CATEGORY_KEYS.list,
        queryFn: getCustomerCategories
    })
