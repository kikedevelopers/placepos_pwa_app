import { createQuery } from '@tanstack/svelte-query'
import { getWallets } from '$lib/api/requests/wallets'
import { WALLET_KEYS } from '$lib/modules/Finance/constants/queryKeys'

/** Listado de billeteras activas de la company. */
export const useWallets = () =>
    createQuery({
        queryKey: WALLET_KEYS.list,
        queryFn: getWallets
    })
