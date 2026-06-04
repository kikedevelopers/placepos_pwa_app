import { createMutation, useQueryClient } from '@tanstack/svelte-query'
import {
    createBank,
    updateBank,
    type CreateBankPayload,
    type UpdateBankPayload
} from '$lib/api/requests/banks'
import { BANK_KEYS, MOVEMENT_KEYS } from '$lib/modules/Finance/constants/queryKeys'

/**
 * Mutaciones de cuentas bancarias (crear y actualizar). Tras cualquiera se
 * invalida la lista y los movimientos (un alta con saldo inicial genera uno).
 */
export const useBankMutations = () => {
    const queryClient = useQueryClient()

    const invalidate = () =>
        Promise.all([
            queryClient.invalidateQueries({ queryKey: BANK_KEYS.all }),
            queryClient.invalidateQueries({ queryKey: MOVEMENT_KEYS.all })
        ])

    const create = createMutation({
        mutationFn: (payload: CreateBankPayload) => createBank(payload),
        onSuccess: invalidate
    })

    const update = createMutation({
        mutationFn: ({ id, payload }: { id: number; payload: UpdateBankPayload }) =>
            updateBank(id, payload),
        onSuccess: invalidate
    })

    return { create, update }
}
