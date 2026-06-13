import { toStore } from 'svelte/store'
import { createQuery } from '@tanstack/svelte-query'
import { getMovements, type MovementsDateRange } from '$lib/api/requests/financial-movements'
import { MOVEMENT_KEYS } from '$lib/modules/Finance/constants/queryKeys'

/**
 * Movimientos de la cuenta bancaria seleccionada, filtrados por rango de fechas.
 * `bankId` y `range` son getters para que la query refetchee al cambiar de
 * cuenta o de rango; se deshabilita si no hay selección.
 */
export const useBankMovements = (bankId: () => number | null, range: () => MovementsDateRange) =>
    createQuery(
        toStore(() => {
            const id = bankId()
            const r = range()
            return {
                queryKey: [...MOVEMENT_KEYS.byAccount('bank', id), r.from, r.to],
                queryFn: () => getMovements('bank', id as number, r),
                enabled: id != null
            }
        })
    )
