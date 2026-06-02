import { toStore } from 'svelte/store'
import { createQuery } from '@tanstack/svelte-query'
import { getPurchases } from '$lib/api/requests'
import { PURCHASE_KEYS } from '$lib/modules/Purchases/constants/queryKeys'

// `showAll` es un getter para que las opciones sean reactivas al filtro de scope
// (svelte-query acepta un store de opciones; `toStore` lo crea desde runes).
// Así el queryKey cambia con showAll y la query refetchea al alternar el filtro.
export const usePurchases = (showAll: () => boolean) =>
    createQuery(
        toStore(() => ({
            queryKey: PURCHASE_KEYS.list(showAll()),
            queryFn: () => getPurchases(showAll())
        }))
    )
