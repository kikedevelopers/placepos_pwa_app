import { fromStore, toStore } from 'svelte/store'
import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query'
import {
    getAccountTransferDestinations,
    transferBetweenAccounts,
    type AccountTransferDestination,
    type TransferSourceType
} from '$lib/api/requests/accounts'
import { getErrorMessage } from '$lib/utils/errors'
import { roundTo } from '$lib/utils/numbers'
import { BANK_KEYS, MOVEMENT_KEYS, WALLET_KEYS } from '../constants/queryKeys'

export type TransferSource = {
    type: TransferSourceType
    id: number
    name: string
    balance: number
}

/**
 * Controlador de "Mover saldo". Carga los destinos válidos para la fuente,
 * valida que el monto no exceda el saldo y ejecuta el traslado atómico. Al
 * confirmar invalida billeteras, bancos y movimientos (cambian dos cuentas).
 */
export function useAccountTransfer(source: TransferSource, onSuccess: () => void) {
    const queryClient = useQueryClient()

    const destinationsQuery = createQuery(
        toStore(() => ({
            queryKey: ['transfer-destinations', source.type, source.id],
            queryFn: () => getAccountTransferDestinations(source.type, source.id)
        }))
    )
    const dq = fromStore(destinationsQuery)

    const mutation = createMutation({
        mutationFn: transferBetweenAccounts,
        onSuccess: () =>
            Promise.all([
                queryClient.invalidateQueries({ queryKey: WALLET_KEYS.all }),
                queryClient.invalidateQueries({ queryKey: BANK_KEYS.all }),
                queryClient.invalidateQueries({ queryKey: MOVEMENT_KEYS.all }),
                // Los destinos llevan su propio balance; refrescarlos evita saldos
                // obsoletos en un segundo traslado dentro de la misma sesión.
                queryClient.invalidateQueries({ queryKey: ['transfer-destinations'] })
            ])
    })
    const m = fromStore(mutation)

    // Clave del destino seleccionado con formato "type:id" (ej. "bank:2").
    let selectedKey = $state('')
    let amount = $state<number | null>(null)
    let submitError = $state('')

    const destinations = $derived(dq.current.data ?? [])
    const isLoadingDestinations = $derived(dq.current.isLoading)

    const grouped = $derived({
        users: destinations.filter((d) => d.type === 'user'),
        wallets: destinations.filter((d) => d.type === 'wallet'),
        banks: destinations.filter((d) => d.type === 'bank')
    })
    const hasDestinations = $derived(destinations.length > 0)

    const selectedDestination = $derived.by((): AccountTransferDestination | null => {
        if (!selectedKey) return null
        const [type, id] = selectedKey.split(':')
        return destinations.find((d) => d.type === type && d.id === Number(id)) ?? null
    })

    const insufficient = $derived(
        amount != null && amount > 0 && roundTo(source.balance - amount, 2) < 0
    )
    const newSourceBalance = $derived(
        amount != null && amount > 0 ? roundTo(source.balance - amount, 2) : source.balance
    )
    const newDestinationBalance = $derived(
        selectedDestination && amount != null && amount > 0
            ? roundTo(selectedDestination.balance + amount, 2)
            : (selectedDestination?.balance ?? 0)
    )
    const canSubmit = $derived(
        !!selectedDestination &&
            amount != null &&
            amount > 0 &&
            !insufficient &&
            !m.current.isPending
    )

    const submit = () => {
        submitError = ''
        const dest = selectedDestination
        if (!dest || amount == null || amount <= 0 || insufficient) return

        m.current.mutate(
            {
                sourceType: source.type,
                sourceId: source.id,
                destinationType: dest.type,
                destinationId: dest.id,
                amount: roundTo(amount, 2)
            },
            {
                onSuccess,
                onError: (error: unknown) =>
                    (submitError = getErrorMessage(error) ?? 'No se pudo realizar el traslado.')
            }
        )
    }

    return {
        get selectedKey() {
            return selectedKey
        },
        set selectedKey(v: string) {
            selectedKey = v
        },
        get amount() {
            return amount
        },
        set amount(v: number | null) {
            amount = v
        },
        get grouped() {
            return grouped
        },
        get hasDestinations() {
            return hasDestinations
        },
        get isLoadingDestinations() {
            return isLoadingDestinations
        },
        get selectedDestination() {
            return selectedDestination
        },
        get insufficient() {
            return insufficient
        },
        get newSourceBalance() {
            return newSourceBalance
        },
        get newDestinationBalance() {
            return newDestinationBalance
        },
        get canSubmit() {
            return canSubmit
        },
        get isSubmitting() {
            return m.current.isPending
        },
        get submitError() {
            return submitError
        },
        submit
    }
}
