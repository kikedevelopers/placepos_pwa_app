import { queryClient } from '$lib/api/queryClient'
import { BANK_KEYS, MOVEMENT_KEYS, WALLET_KEYS } from '$lib/modules/Finance/constants/queryKeys'
import type { AssistantCard } from './cards'

/**
 * Vistas que muestran saldos de cajas, bancos y billeteras. Cuando Place mueve
 * o corrige un saldo (tarjeta `treasury_done`), se invalidan para que Bancos,
 * Billeteras, Finanzas y la caja del POS no queden con el valor viejo. Espejo
 * de `treasuryRefresh` de placepos.
 */
const TREASURY_QUERY_KEYS: readonly (readonly unknown[])[] = [
    BANK_KEYS.all,
    WALLET_KEYS.all,
    MOVEMENT_KEYS.all,
    ['transfer-destinations'],
    ['pos', 'cash-summary'],
    ['dashboard', 'today'],
    ['reports']
]

export const refreshAfterCard = (card: AssistantCard): void => {
    if (card.kind !== 'treasury_done') return
    for (const queryKey of TREASURY_QUERY_KEYS) {
        void queryClient.invalidateQueries({ queryKey: [...queryKey] })
    }
}
