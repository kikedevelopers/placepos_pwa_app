import { toStore } from 'svelte/store'
import { createQuery } from '@tanstack/svelte-query'
import { getMovements } from '$lib/api/requests/financial-movements'
import { MOVEMENT_KEYS } from '$lib/modules/Finance/constants/queryKeys'

/**
 * Movimientos de la cuenta bancaria seleccionada. `bankId` es un getter para que
 * la query refetchee al cambiar de cuenta; se deshabilita si no hay selección.
 */
export const useBankMovements = (bankId: () => number | null) =>
    createQuery(
        toStore(() => {
            const id = bankId()
            return {
                queryKey: MOVEMENT_KEYS.byAccount('bank', id),
                queryFn: () => getMovements('bank', id as number),
                enabled: id != null
            }
        })
    )
