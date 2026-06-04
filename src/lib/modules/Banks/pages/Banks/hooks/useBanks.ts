import { createQuery } from '@tanstack/svelte-query'
import { getBanks } from '$lib/api/requests/banks'
import { BANK_KEYS } from '$lib/modules/Finance/constants/queryKeys'

/** Listado de cuentas bancarias activas de la company. */
export const useBanks = () =>
    createQuery({
        queryKey: BANK_KEYS.list,
        queryFn: getBanks
    })
