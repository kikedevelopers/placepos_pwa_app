import { fromStore } from 'svelte/store'
import { createMutation } from '@tanstack/svelte-query'
import {
    processPayment,
    type PaymentMethod,
    type PosBank,
    type ProcessPaymentPayload
} from '$lib/api/requests/pos'
import { useUserRole } from '$lib/hooks/useUserRole.svelte'
import { getErrorMessage } from '$lib/utils/errors'
import { roundTo } from '$lib/utils/numbers'
import { daysAheadISO } from '$lib/utils/dates'

export type ChargeOrder = {
    invoice_id: number
    total: number
    ticket_number: string
    customer_name: string | null
}

const errorCode = (e: unknown): string | undefined =>
    (e as { payload?: { code?: string } } | null)?.payload?.code

/**
 * Solicita confirmación para autorizar un override (margen bajo / stock
 * insuficiente). `Alert.alert` no existe en web: usamos `window.confirm` como
 * diálogo de confirmación nativo del navegador.
 */
const confirmOverride = (message: string): boolean =>
    typeof window !== 'undefined' && window.confirm(message)

/**
 * Cobro de un ORDER → SALE (paridad `usePayment` de pos_app). Modelado con
 * runes: el estado (`method`, `amountPaid`, `bankId`, `duePreset`,
 * `submitError`) son `$state` y los valores derivados (`change`, `creditAmount`,
 * `isCredit`, `canConfirm`...) son getters reactivos.
 *
 * Idempotencia (dinero real): `client_operation_id` se genera UNA vez por
 * instancia del hook (`crypto.randomUUID()`) y se reusa en cada reintento, de
 * modo que un reintento del mismo cobro no duplica el pago. El backend responde
 * 200 con el pago existente y `code = DUPLICATE_OPERATION`, que tratamos como
 * éxito.
 *
 * Override margen/stock: ante `MARGIN_BELOW_MIN` o `INSUFFICIENT_STOCK`, si el
 * usuario puede gestionar (`canManage`) y aún no se reintentó con override, se
 * pide confirmación y se reenvía con `override_margin/override_stock`.
 *
 * @param order   pedido a cobrar (invoice_id, total capturado, ticket, cliente)
 * @param banks   bancos disponibles para método TRANSFER
 * @param onPaid  callback al cobrar con éxito (incl. DUPLICATE_OPERATION)
 */
export function usePayment(order: ChargeOrder, banks: PosBank[], onPaid: () => void) {
    const role = useUserRole()
    const mutation = fromStore(createMutation({ mutationFn: processPayment }))
    const opId = crypto.randomUUID()

    let method = $state<PaymentMethod>('CASH')
    let amountPaid = $state<number | null>(order.total)
    let bankId = $state('')
    let duePreset = $state('1')
    let submitError = $state('')

    const total = order.total
    const change = $derived(
        method === 'CASH' && (amountPaid ?? 0) > total ? roundTo((amountPaid ?? 0) - total, 2) : 0
    )
    const creditAmount = $derived(
        method === 'CREDIT'
            ? total
            : (amountPaid ?? 0) < total
              ? roundTo(total - (amountPaid ?? 0), 2)
              : 0
    )
    const isCredit = $derived(method === 'CREDIT' || creditAmount > 0)
    const hasCustomer = !!order.customer_name
    const canConfirm = $derived(
        !mutation.current.isPending &&
            (method !== 'TRANSFER' || !!bankId) &&
            (!isCredit || hasCustomer) &&
            (method === 'CREDIT' || (amountPaid ?? 0) > 0)
    )

    const run = (override: boolean) => {
        submitError = ''
        const paid = amountPaid ?? 0
        const bank = banks.find((b) => String(b.id) === bankId)
        const payload: ProcessPaymentPayload = {
            invoice_id: order.invoice_id,
            payment_method: method,
            amount_due: total,
            amount_paid: method === 'CREDIT' ? 0 : paid,
            change_amount: change,
            is_credit: isCredit,
            credit_amount: creditAmount,
            due_date: isCredit ? daysAheadISO(Number(duePreset)) : null,
            bank_id: method === 'TRANSFER' && bank ? bank.id : null,
            bank_name: method === 'TRANSFER' && bank ? bank.name : null,
            client_operation_id: opId,
            ...(override ? { override_margin: true, override_stock: true } : {})
        }
        mutation.current.mutate(payload, {
            onSuccess: () => onPaid(),
            onError: (e) => {
                const code = errorCode(e)
                if (code === 'DUPLICATE_OPERATION') return onPaid()
                if (
                    (code === 'MARGIN_BELOW_MIN' || code === 'INSUFFICIENT_STOCK') &&
                    role.canManage &&
                    !override
                ) {
                    const message =
                        getErrorMessage(e) ?? 'Esta venta requiere autorización.'
                    if (confirmOverride(message)) run(true)
                    return
                }
                submitError = getErrorMessage(e) ?? 'No se pudo procesar el pago.'
            }
        })
    }

    return {
        get method() {
            return method
        },
        setMethod(value: PaymentMethod) {
            method = value
        },
        get amountPaid() {
            return amountPaid
        },
        setAmountPaid(value: number | null) {
            amountPaid = value
        },
        get bankId() {
            return bankId
        },
        setBankId(value: string) {
            bankId = value
        },
        get duePreset() {
            return duePreset
        },
        setDuePreset(value: string) {
            duePreset = value
        },
        total,
        get change() {
            return change
        },
        get creditAmount() {
            return creditAmount
        },
        get isCredit() {
            return isCredit
        },
        hasCustomer,
        get canConfirm() {
            return canConfirm
        },
        get isPending() {
            return mutation.current.isPending
        },
        get submitError() {
            return submitError
        },
        submit: () => run(false)
    }
}
