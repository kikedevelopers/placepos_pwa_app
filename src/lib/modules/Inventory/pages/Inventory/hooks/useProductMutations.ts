import { createMutation, useQueryClient } from '@tanstack/svelte-query'
import { createProduct, updateProduct, type ProductPayload } from '$lib/api/requests/products'
import { PRODUCT_KEYS } from '$lib/modules/Inventory/constants/queryKeys'

export const useProductMutations = () => {
    const queryClient = useQueryClient()
    const invalidate = () => queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.list })

    const create = createMutation({
        mutationFn: (payload: ProductPayload) => createProduct(payload),
        onSuccess: invalidate
    })

    const update = createMutation({
        mutationFn: ({ id, payload }: { id: number; payload: ProductPayload }) =>
            updateProduct(id, payload),
        onSuccess: invalidate
    })

    return { create, update }
}
