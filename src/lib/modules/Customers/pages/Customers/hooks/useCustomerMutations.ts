import { createMutation, useQueryClient } from '@tanstack/svelte-query'
import { createCustomer, updateCustomer, type CustomerPayload } from '$lib/api/requests/customers'
import { CUSTOMER_KEYS } from '$lib/modules/Customers/constants/queryKeys'

export const useCustomerMutations = () => {
    const queryClient = useQueryClient()

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: CUSTOMER_KEYS.list })
        queryClient.invalidateQueries({ queryKey: CUSTOMER_KEYS.analytics })
    }

    const create = createMutation({
        mutationFn: (payload: CustomerPayload) => createCustomer(payload),
        onSuccess: invalidate
    })

    const update = createMutation({
        mutationFn: ({ id, payload }: { id: number; payload: CustomerPayload }) =>
            updateCustomer(id, payload),
        onSuccess: invalidate
    })

    return { create, update }
}
