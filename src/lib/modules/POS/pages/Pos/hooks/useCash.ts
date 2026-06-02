import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query'
import {
    closeCash,
    getCashSummary,
    getTransferDestinations,
    type CloseCashPayload
} from '$lib/api/requests/cash'
import { POS_KEYS } from '$lib/modules/POS/constants/queryKeys'

/**
 * Mensajes de error de cierre de caja por código de negocio (verbatim de
 * pos_app). El componente puede mostrar `ERROR_BY_CODE[code]` con fallback a
 * `getErrorMessage`.
 */
export const ERROR_BY_CODE: Record<string, string> = {
    NOTHING_TO_REGISTER: 'No hay excedente para trasladar.',
    INSUFFICIENT_BALANCE: 'Saldo insuficiente en la caja.',
    COUNTED_BELOW_BASE: 'El efectivo contado está por debajo de la base.',
    DESTINATION_REQUIRED: 'Selecciona un destino para el excedente.',
    UNSUPPORTED_DESTINATION: 'Destino no permitido.'
}

export const useCashSummary = () =>
    createQuery({ queryKey: POS_KEYS.cashSummary, queryFn: getCashSummary })

export const useTransferDestinations = () =>
    createQuery({ queryKey: POS_KEYS.transferDestinations, queryFn: getTransferDestinations })

/**
 * Cierre de caja. `idempotencyKey` se envía como header `Idempotency-Key`
 * (dinero real). Al éxito invalida el resumen de caja.
 */
export const useCloseCash = () => {
    const queryClient = useQueryClient()
    return createMutation({
        mutationFn: ({
            payload,
            idempotencyKey
        }: {
            payload: CloseCashPayload
            idempotencyKey: string
        }) => closeCash(payload, idempotencyKey),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: POS_KEYS.cashSummary })
    })
}
