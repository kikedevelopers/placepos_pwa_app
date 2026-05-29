import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query'
import {
    createCategory,
    createPackaging,
    getCategories,
    getPackagings
} from '$lib/api/requests/catalog'
import { PRODUCT_KEYS } from '$lib/modules/Inventory/constants/queryKeys'

export const useCategories = () =>
    createQuery({ queryKey: PRODUCT_KEYS.categories, queryFn: getCategories })

export const usePackagings = () =>
    createQuery({ queryKey: PRODUCT_KEYS.packagings, queryFn: getPackagings })

export const useCreateCategory = () => {
    const queryClient = useQueryClient()
    return createMutation({
        mutationFn: (name: string) => createCategory(name),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.categories })
    })
}

export const useCreatePackaging = () => {
    const queryClient = useQueryClient()
    return createMutation({
        mutationFn: ({ name, value }: { name: string; value: number }) =>
            createPackaging(name, value),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.packagings })
    })
}
