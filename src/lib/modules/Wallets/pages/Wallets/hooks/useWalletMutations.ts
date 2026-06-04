import { createMutation, useQueryClient } from '@tanstack/svelte-query'
import {
    createWallet,
    updateWallet,
    type CreateWalletPayload,
    type UpdateWalletPayload
} from '$lib/api/requests/wallets'
import { MOVEMENT_KEYS, WALLET_KEYS } from '$lib/modules/Finance/constants/queryKeys'

/**
 * Mutaciones de billeteras (crear y renombrar). Tras cualquiera se invalida la
 * lista y los movimientos (un alta con saldo inicial genera un movimiento).
 */
export const useWalletMutations = () => {
    const queryClient = useQueryClient()

    const invalidate = () =>
        Promise.all([
            queryClient.invalidateQueries({ queryKey: WALLET_KEYS.all }),
            queryClient.invalidateQueries({ queryKey: MOVEMENT_KEYS.all })
        ])

    const create = createMutation({
        mutationFn: (payload: CreateWalletPayload) => createWallet(payload),
        onSuccess: invalidate
    })

    const update = createMutation({
        mutationFn: ({ id, payload }: { id: number; payload: UpdateWalletPayload }) =>
            updateWallet(id, payload),
        onSuccess: invalidate
    })

    return { create, update }
}
