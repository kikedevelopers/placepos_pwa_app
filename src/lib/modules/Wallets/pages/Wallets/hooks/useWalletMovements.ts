import { toStore } from 'svelte/store'
import { createQuery } from '@tanstack/svelte-query'
import { getMovements, type MovementsDateRange } from '$lib/api/requests/financial-movements'
import { MOVEMENT_KEYS } from '$lib/modules/Finance/constants/queryKeys'

/**
 * Movimientos de la billetera seleccionada, filtrados por rango de fechas.
 * `walletId` y `range` son getters para que la query refetchee al cambiar de
 * billetera o de rango; se deshabilita si no hay selección.
 */
export const useWalletMovements = (
    walletId: () => number | null,
    range: () => MovementsDateRange
) =>
    createQuery(
        toStore(() => {
            const id = walletId()
            const r = range()
            return {
                queryKey: [...MOVEMENT_KEYS.byAccount('wallet', id), r.from, r.to],
                queryFn: () => getMovements('wallet', id as number, r),
                enabled: id != null
            }
        })
    )
