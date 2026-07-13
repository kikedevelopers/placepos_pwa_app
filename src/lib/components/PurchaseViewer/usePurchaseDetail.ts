import { toStore } from 'svelte/store'
import { createQuery } from '@tanstack/svelte-query'
import { getPurchase } from '$lib/api/requests/purchases'
import { PURCHASE_KEYS } from '$lib/modules/Purchases/constants/queryKeys'

/**
 * Detalle completo de una compra (líneas + credit + abonos + transporte) para
 * el visor. `id` es un getter para reaccionar a la compra abierta.
 */
export const usePurchaseDetail = (id: () => number | null) =>
    createQuery(
        toStore(() => ({
            queryKey: PURCHASE_KEYS.detail(id() ?? -1),
            queryFn: () => getPurchase(id() as number),
            enabled: id() != null
        }))
    )
