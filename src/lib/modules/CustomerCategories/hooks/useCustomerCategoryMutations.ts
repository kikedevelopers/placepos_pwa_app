import { createMutation, useQueryClient } from '@tanstack/svelte-query'
import {
    createCustomerCategory,
    type CreateCustomerCategoryPayload
} from '$lib/api/requests/customerCategories'
import { CUSTOMER_CATEGORY_KEYS } from '$lib/modules/CustomerCategories/constants/queryKeys'

export const useCustomerCategoryMutations = () => {
    const queryClient = useQueryClient()

    const create = createMutation({
        mutationFn: (payload: CreateCustomerCategoryPayload) => createCustomerCategory(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CUSTOMER_CATEGORY_KEYS.list })
        }
    })

    return { create }
}
