import { toStore } from 'svelte/store'
import { createQuery } from '@tanstack/svelte-query'
import { getMovements } from '$lib/api/requests/financial-movements'
import { MOVEMENT_KEYS } from '$lib/modules/Finance/constants/queryKeys'

/**
 * Movimientos de la billetera seleccionada. `walletId` es un getter para que la
 * query refetchee al cambiar de billetera; se deshabilita si no hay selección.
 */
export const useWalletMovements = (walletId: () => number | null) =>
    createQuery(
        toStore(() => {
            const id = walletId()
            return {
                queryKey: MOVEMENT_KEYS.byAccount('wallet', id),
                queryFn: () => getMovements('wallet', id as number),
                enabled: id != null
            }
        })
    )
