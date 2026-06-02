import { createQuery } from '@tanstack/svelte-query'
import { getPosBanks, getPosCustomers, getPosItems } from '$lib/api/requests/pos'
import { POS_KEYS } from '$lib/modules/POS/constants/queryKeys'

const STALE_TIME = 5 * 60_000

export const usePosItems = () =>
    createQuery({ queryKey: POS_KEYS.items, queryFn: getPosItems, staleTime: STALE_TIME })

export const usePosCustomers = () =>
    createQuery({ queryKey: POS_KEYS.customers, queryFn: getPosCustomers, staleTime: STALE_TIME })

export const usePosBanks = () =>
    createQuery({ queryKey: POS_KEYS.banks, queryFn: getPosBanks, staleTime: STALE_TIME })
