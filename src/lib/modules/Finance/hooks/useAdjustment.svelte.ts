import { fromStore } from 'svelte/store'
import { createMutation, useQueryClient } from '@tanstack/svelte-query'
import type { ZodError } from 'zod'
import { adjustBank, type BankAdjustmentResult } from '$lib/api/requests/banks'
import { adjustWallet, type WalletAdjustmentResult } from '$lib/api/requests/wallets'
import { getErrorMessage } from '$lib/utils/errors'
import { roundTo } from '$lib/utils/numbers'
import { BANK_KEYS, MOVEMENT_KEYS, WALLET_KEYS } from '../constants/queryKeys'
import {
    adjustmentDefaults,
    adjustmentSchema,
    MOVEMENT_TYPE,
    type AdjustmentFormData
} from '../schemas/adjustment.schema'

export type AdjustmentTargetKind = 'wallet' | 'bank'

export type AdjustmentTarget = {
    kind: AdjustmentTargetKind
    id: number
    name: string
    balance: number
}

type MutateArgs = {
    kind: AdjustmentTargetKind
    id: number
    payload: AdjustmentFormData
}

const buildErrors = (error: ZodError): Record<string, string> => {
    const map: Record<string, string> = {}
    for (const issue of error.issues) {
        const key = issue.path.join('.')
        if (!(key in map)) map[key] = issue.message
    }
    return map
}

/**
 * Controlador de la corrección de saldo (ajuste). Despacha a wallet o bank según
 * el target, valida que un EXPENSE no exceda el saldo y, al confirmar, invalida
 * listas y movimientos para refrescar el saldo.
 */
export function useAdjustmentForm(target: AdjustmentTarget, onSuccess: () => void) {
    const queryClient = useQueryClient()

    const mutation = createMutation({
        mutationFn: ({
            kind,
            id,
            payload
        }: MutateArgs): Promise<WalletAdjustmentResult | BankAdjustmentResult> =>
            kind === 'bank' ? adjustBank(id, payload) : adjustWallet(id, payload),
        onSuccess: () =>
            Promise.all([
                queryClient.invalidateQueries({ queryKey: WALLET_KEYS.all }),
                queryClient.invalidateQueries({ queryKey: BANK_KEYS.all }),
                queryClient.invalidateQueries({ queryKey: MOVEMENT_KEYS.all })
            ])
    })
    const m = fromStore(mutation)

    const form = $state<AdjustmentFormData>(adjustmentDefaults())
    let attempted = $state(false)
    let submitError = $state('')

    const validation = $derived(adjustmentSchema.safeParse($state.snapshot(form)))
    const errors = $derived(attempted && !validation.success ? buildErrors(validation.error) : {})

    const balanceExceeded = $derived(
        form.movement_type === MOVEMENT_TYPE.EXPENSE &&
            form.amount > 0 &&
            form.amount > target.balance
    )

    const submit = () => {
        attempted = true
        submitError = ''
        if (!validation.success || balanceExceeded) return
        const data = validation.data

        m.current.mutate(
            {
                kind: target.kind,
                id: target.id,
                payload: {
                    movement_type: data.movement_type,
                    amount: roundTo(data.amount, 2),
                    description: data.description.trim()
                }
            },
            {
                onSuccess,
                onError: (error: unknown) =>
                    (submitError = getErrorMessage(error) ?? 'No se pudo registrar el ajuste.')
            }
        )
    }

    return {
        form,
        get errors() {
            return errors
        },
        get balanceExceeded() {
            return balanceExceeded
        },
        submit,
        get isSubmitting() {
            return m.current.isPending
        },
        get submitError() {
            return submitError
        }
    }
}
