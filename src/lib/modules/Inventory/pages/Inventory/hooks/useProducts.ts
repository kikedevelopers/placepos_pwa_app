import { createQuery } from '@tanstack/svelte-query'
import { getProducts } from '$lib/api/requests/products'
import { PRODUCT_KEYS } from '$lib/modules/Inventory/constants/queryKeys'

export const useProducts = () =>
    createQuery({
        queryKey: PRODUCT_KEYS.list,
        queryFn: () => getProducts()
    })
