import { fromStore } from 'svelte/store'
import type { ZodError } from 'zod'
import type { BankAccount, CreateBankPayload, UpdateBankPayload } from '$lib/api/requests/banks'
import { getErrorMessage } from '$lib/utils/errors'
import { roundTo } from '$lib/utils/numbers'
import {
    bankAccountSchema,
    bankDefaults,
    bankEditSchema,
    type BankAccountFormData,
    type BankEditData
} from '../schemas/bank.schema'
import { useBankMutations } from './useBankMutations'

const buildErrors = (error: ZodError): Record<string, string> => {
    const map: Record<string, string> = {}
    for (const issue of error.issues) {
        const key = issue.path.join('.')
        if (!(key in map)) map[key] = issue.message
    }
    return map
}

/** Controlador del alta de cuenta bancaria. */
export function useBankCreateForm(onSuccess: () => void) {
    const { create } = useBankMutations()
    const c = fromStore(create)

    const form = $state<BankAccountFormData>(bankDefaults())
    let attempted = $state(false)
    let submitError = $state('')

    const validation = $derived(bankAccountSchema.safeParse($state.snapshot(form)))
    const errors = $derived(attempted && !validation.success ? buildErrors(validation.error) : {})

    const submit = () => {
        attempted = true
        submitError = ''
        if (!validation.success) return
        const data = validation.data

        const balance = roundTo(data.initial_balance, 2)
        const payload: CreateBankPayload = {
            name: data.name.trim(),
            account_number: data.account_number.trim(),
            account_type: data.account_type,
            available_in_pos: data.available_in_pos,
            // El contrato cloud espera string decimal; se omite cuando es 0.
            ...(balance > 0 ? { initial_balance: balance.toFixed(2) } : {})
        }

        c.current.mutate(payload, {
            onSuccess,
            onError: (error: unknown) =>
                (submitError = getErrorMessage(error) ?? 'No se pudo registrar la cuenta.')
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

/** Controlador de la edición de cuenta bancaria (sin saldo inicial). */
export function useBankEditForm(bank: BankAccount, onSuccess: () => void) {
    const { update } = useBankMutations()
    const u = fromStore(update)

    const form = $state<BankEditData>({
        name: bank.name,
        account_number: bank.account_number,
        account_type: bank.account_type,
        available_in_pos: bank.available_in_pos
    })
    let attempted = $state(false)
    let submitError = $state('')

    const validation = $derived(bankEditSchema.safeParse($state.snapshot(form)))
    const errors = $derived(attempted && !validation.success ? buildErrors(validation.error) : {})

    const submit = () => {
        attempted = true
        submitError = ''
        if (!validation.success) return
        const data = validation.data

        const payload: UpdateBankPayload = {
            name: data.name.trim(),
            account_number: data.account_number.trim(),
            account_type: data.account_type,
            available_in_pos: data.available_in_pos
        }

        u.current.mutate(
            { id: bank.id, payload },
            {
                onSuccess,
                onError: (error: unknown) =>
                    (submitError = getErrorMessage(error) ?? 'No se pudo guardar la cuenta.')
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
