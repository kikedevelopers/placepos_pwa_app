import { fromStore } from 'svelte/store'
import type { ZodError } from 'zod'
import type { CreateWalletPayload, WalletAccount } from '$lib/api/requests/wallets'
import { getErrorMessage } from '$lib/utils/errors'
import { roundTo } from '$lib/utils/numbers'
import {
    walletDefaults,
    walletEditSchema,
    walletSchema,
    type WalletEditData,
    type WalletFormData
} from '../schemas/wallet.schema'
import { useWalletMutations } from './useWalletMutations'

const buildErrors = (error: ZodError): Record<string, string> => {
    const map: Record<string, string> = {}
    for (const issue of error.issues) {
        const key = issue.path.join('.')
        if (!(key in map)) map[key] = issue.message
    }
    return map
}

/** Controlador del alta de billetera (nombre + saldo inicial). */
export function useWalletCreateForm(onSuccess: () => void) {
    const { create } = useWalletMutations()
    const c = fromStore(create)

    const form = $state<WalletFormData>(walletDefaults())
    let attempted = $state(false)
    let submitError = $state('')

    const validation = $derived(walletSchema.safeParse($state.snapshot(form)))
    const errors = $derived(attempted && !validation.success ? buildErrors(validation.error) : {})

    const submit = () => {
        attempted = true
        submitError = ''
        if (!validation.success) return
        const data = validation.data

        const balance = roundTo(data.initial_balance, 2)
        const payload: CreateWalletPayload = {
            name: data.name.trim(),
            // El contrato cloud espera string decimal; se omite cuando es 0.
            ...(balance > 0 ? { initial_balance: balance.toFixed(2) } : {})
        }

        c.current.mutate(payload, {
            onSuccess,
            onError: (error: unknown) =>
                (submitError = getErrorMessage(error) ?? 'No se pudo registrar la billetera.')
        })
    }

    return {
        form,
        get errors() {
            return errors
        },
        submit,
        get isSubmitting() {
            return c.current.isPending
        },
        get submitError() {
            return submitError
        }
    }
}

/** Controlador de la edición de billetera (solo nombre). */
export function useWalletEditForm(wallet: WalletAccount, onSuccess: () => void) {
    const { update } = useWalletMutations()
    const u = fromStore(update)

    const form = $state<WalletEditData>({ name: wallet.name })
    let attempted = $state(false)
    let submitError = $state('')

    const validation = $derived(walletEditSchema.safeParse($state.snapshot(form)))
    const errors = $derived(attempted && !validation.success ? buildErrors(validation.error) : {})

    const submit = () => {
        attempted = true
        submitError = ''
        if (!validation.success) return

        u.current.mutate(
            { id: wallet.id, payload: { name: validation.data.name.trim() } },
            {
                onSuccess,
                onError: (error: unknown) =>
                    (submitError = getErrorMessage(error) ?? 'No se pudo guardar la billetera.')
            }
        )
    }

    return {
        form,
        get errors() {
            return errors
        },
        submit,
        get isSubmitting() {
            return u.current.isPending
        },
        get submitError() {
            return submitError
        }
    }
}
