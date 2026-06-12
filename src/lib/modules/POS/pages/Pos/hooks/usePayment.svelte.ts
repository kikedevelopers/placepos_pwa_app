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
import { randomUUID } from '$lib/utils/uuid'
import { todayISO, daysAheadISO } from '$lib/utils/dates'
import { usePosBanks } from './usePosData'

export type ChargeOrder = {
    invoice_id: number
    total: number
    ticket_number: string
    customer_name: string | null
}

/** Tender local (con id para listar/quitar en la UI; el id NO se envía). */
export type Tender = {
    id: string
    payment_method: 'CASH' | 'TRANSFER'
    amount_paid: number
    change_amount: number
    bank_id: number | null
    bank_name: string | null
}

/** Lo que abona NETO al ticket (amount_paid − change_amount). */
export const tenderNet = (t: Tender): number => Math.max(0, roundTo(t.amount_paid - t.change_amount, 2))

type PaymentRequest = {
    tenders: Tender[]
    isCredit: boolean
    creditAmount: number
    dueDate: string | null
}

const errorCode = (e: unknown): string | undefined =>
    (e as { payload?: { code?: string } } | null)?.payload?.code

/** `Alert.alert` no existe en web: window.confirm como diálogo de override. */
const confirmOverride = (message: string): boolean =>
    typeof window !== 'undefined' && window.confirm(message)

/**
 * Cobro de un ORDER → SALE con paridad EXACTA al flujo de placepos
 * (`usePaymentForm` + `useMultiPayment`): pago simple o **dividido** (split
 * tender). El contrato real es `payments[]` (no el shape plano legado).
 *
 * Fase simple: método CASH/TRANSFER/CREDIT. Al confirmar:
 *   - CREDIT puro → payments:[] + is_credit + credit_amount=total.
 *   - cubre el total → payments:[1 tender], sin crédito.
 *   - abono parcial → entra a PAGO DIVIDIDO con el primer abono ya capturado.
 *
 * Fase dividida: se agregan N tenders (efectivo único; transferencia por banco
 * no repetido) hasta cubrir el total o mandar el remanente a crédito.
 *
 * Idempotencia (dinero real): `client_operation_id` estable por instancia del
 * hook (el cuerpo se remonta por pedido vía {#key}). Se reusa en reintentos para
 * que el backend deduplique y jamás cobre dos veces.
 *
 * Override margen/stock: ante `MARGIN_BELOW_MIN`/`INSUFFICIENT_STOCK`, si el
 * usuario es owner/superadmin (`canVoid`), se confirma y se reenvía con el flag.
 */
export function usePayment(order: ChargeOrder, onPaid: () => void) {
    const role = useUserRole()
    const mutation = fromStore(createMutation({ mutationFn: processPayment }))
    const banksQuery = fromStore(usePosBanks())
    const banks = $derived<PosBank[]>(banksQuery.current.data ?? [])
    const opId = randomUUID()

    const total = order.total
    const hasCustomer = !!order.customer_name

    // ----- Fase simple -----
    let phase = $state<'simple' | 'split'>('simple')
    let method = $state<PaymentMethod>('CASH')
    let amount = $state<number | null>(total)
    let bankId = $state('')
    let dueDate = $state(daysAheadISO(1)) // mañana por defecto (paridad placepos)
    let submitError = $state('')

    // ----- Fase dividida -----
    let tenders = $state<Tender[]>([])

    // Derivados — fase simple
    const change = $derived(
        method === 'CASH' && (amount ?? 0) > total ? roundTo((amount ?? 0) - total, 2) : 0
    )
    const simpleCredit = $derived(
        method === 'CREDIT'
            ? total
            : (amount ?? 0) < total
              ? roundTo(total - (amount ?? 0), 2)
              : 0
    )
    const showPartialWarning = $derived(
        method !== 'CREDIT' && (amount ?? 0) > 0 && (amount ?? 0) < total
    )
    const canConfirmSimple = $derived(
        !mutation.current.isPending &&
            (method === 'CREDIT'
                ? hasCustomer
                : (amount ?? 0) > 0 && (method !== 'TRANSFER' || !!bankId))
    )

    // Derivados — fase dividida
    const covered = $derived(roundTo(tenders.reduce((a, t) => a + tenderNet(t), 0), 2))
    const remaining = $derived(Math.max(0, roundTo(total - covered, 2)))
    const isFullyCovered = $derived(remaining <= 0)
    const usedBankIds = $derived(
        new Set(tenders.filter((t) => t.bank_id != null).map((t) => t.bank_id as number))
    )
    const availableBanks = $derived(banks.filter((b) => !usedBankIds.has(b.id)))
    const hasCashTender = $derived(tenders.some((t) => t.payment_method === 'CASH'))
    const canAddCash = $derived(!isFullyCovered && !hasCashTender)
    const canAddTransfer = $derived(!isFullyCovered && availableBanks.length > 0)
    const canUseCredit = $derived(!isFullyCovered && hasCustomer)

    const isPending = $derived(mutation.current.isPending)

    // ---- Construcción del payload + mutación + overrides ----
    const runRequest = (req: PaymentRequest, override: { margin?: boolean; stock?: boolean }) => {
        const willCredit = req.isCredit && req.creditAmount > 0
        const payload: ProcessPaymentPayload = {
            invoice_id: order.invoice_id,
            amount_due: total,
            payments: req.tenders.map((t) => ({
                payment_method: t.payment_method,
                amount_paid: t.amount_paid,
                change_amount: t.change_amount,
                bank_id: t.bank_id,
                bank_name: t.bank_name
            })),
            is_credit: willCredit,
            credit_amount: willCredit ? req.creditAmount : 0,
            due_date: willCredit ? req.dueDate || todayISO() : null,
            client_operation_id: opId,
            ...(override.margin ? { override_margin: true } : {}),
            ...(override.stock ? { override_stock: true } : {})
        }
        mutation.current.mutate(payload, {
            onSuccess: () => onPaid(),
            onError: (e) => {
                const code = errorCode(e)
                if (code === 'DUPLICATE_OPERATION') return onPaid()
                // Override solo owner/superadmin (= canVoid, igual a OWNER_LIKE_TYPES).
                if (code === 'MARGIN_BELOW_MIN' && role.canVoid && !override.margin) {
                    const msg = getErrorMessage(e) ?? 'Margen por debajo del mínimo permitido.'
                    if (confirmOverride(`${msg}\n\n¿Autorizar y procesar el pago?`)) {
                        runRequest(req, { ...override, margin: true })
                    }
                    return
                }
                if (code === 'INSUFFICIENT_STOCK' && role.canVoid && !override.stock) {
                    const msg = getErrorMessage(e) ?? 'Stock insuficiente para completar la venta.'
                    if (confirmOverride(`${msg}\n\n¿Autorizar y procesar el pago?`)) {
                        runRequest(req, { ...override, stock: true })
                    }
                    return
                }
                submitError = getErrorMessage(e) ?? 'No se pudo procesar el pago.'
            }
        })
    }
    const process = (req: PaymentRequest) => {
        if (mutation.current.isPending) return
        submitError = ''
        runRequest(req, {})
    }

    // ---- Fase simple → confirmar (handleSubmit de placepos) ----
    const buildCurrentTender = (): Tender => {
        const isCash = method === 'CASH'
        const paid = amount ?? 0
        const ch = isCash ? Math.max(0, roundTo(paid - total, 2)) : 0
        const bank = banks.find((b) => String(b.id) === bankId)
        return {
            id: randomUUID(),
            payment_method: isCash ? 'CASH' : 'TRANSFER',
            amount_paid: paid,
            change_amount: ch,
            bank_id: method === 'TRANSFER' ? (bank?.id ?? null) : null,
            bank_name: method === 'TRANSFER' ? (bank?.name ?? null) : null
        }
    }

    const submitSimple = () => {
        submitError = ''
        if (mutation.current.isPending) return
        if (method === 'CREDIT') {
            if (!hasCustomer) return
            process({ tenders: [], isCredit: true, creditAmount: total, dueDate })
            return
        }
        if (method === 'TRANSFER' && !bankId) return
        const tender = buildCurrentTender()
        const netPaid = tenderNet(tender)
        if (netPaid <= 0) return
        // Parcial → pago dividido con el primer abono ya capturado.
        if (netPaid < total) {
            tenders = [tender]
            phase = 'split'
            return
        }
        process({ tenders: [tender], isCredit: false, creditAmount: 0, dueDate: null })
    }

    // ---- Fase dividida ----
    const addTender = (m: 'CASH' | 'TRANSFER', amt: number, bank?: PosBank | null) => {
        if (!amt || amt <= 0) return
        const isCash = m === 'CASH'
        const amountPaid = isCash ? amt : Math.min(amt, remaining)
        const ch = isCash ? Math.max(0, roundTo(amt - remaining, 2)) : 0
        tenders = [
            ...tenders,
            {
                id: randomUUID(),
                payment_method: m,
                amount_paid: amountPaid,
                change_amount: ch,
                bank_id: m === 'TRANSFER' ? (bank?.id ?? null) : null,
                bank_name: m === 'TRANSFER' ? (bank?.name ?? null) : null
            }
        ]
    }
    const removeTender = (id: string) => {
        tenders = tenders.filter((t) => t.id !== id)
    }
    const finalizeCovered = () => {
        if (!isFullyCovered) return
        process({ tenders, isCredit: false, creditAmount: 0, dueDate: null })
    }
    const finalizeWithCredit = () => {
        if (remaining <= 0 || !hasCustomer) return
        process({ tenders, isCredit: true, creditAmount: remaining, dueDate })
    }
    const backToSimple = () => {
        phase = 'simple'
        tenders = []
        submitError = ''
    }

    return {
        order,
        total,
        hasCustomer,
        get banks() {
            return banks
        },
        // fase
        get phase() {
            return phase
        },
        // simple
        get method() {
            return method
        },
        setMethod(value: PaymentMethod) {
            method = value
            if (value !== 'TRANSFER') bankId = ''
            if (value === 'CREDIT') amount = 0
            else if ((amount ?? 0) === 0) amount = total
            submitError = ''
        },
        get amount() {
            return amount
        },
        setAmount(value: number | null) {
            amount = value
            submitError = ''
        },
        get bankId() {
            return bankId
        },
        setBankId(value: string) {
            bankId = value
            submitError = ''
        },
        get dueDate() {
            return dueDate
        },
        setDueDate(value: string) {
            dueDate = value
        },
        get change() {
            return change
        },
        get simpleCredit() {
            return simpleCredit
        },
        get showPartialWarning() {
            return showPartialWarning
        },
        get canConfirmSimple() {
            return canConfirmSimple
        },
        submitSimple,
        // split
        get tenders() {
            return tenders
        },
        get covered() {
            return covered
        },
        get remaining() {
            return remaining
        },
        get isFullyCovered() {
            return isFullyCovered
        },
        get availableBanks() {
            return availableBanks
        },
        get canAddCash() {
            return canAddCash
        },
        get canAddTransfer() {
            return canAddTransfer
        },
        get canUseCredit() {
            return canUseCredit
        },
        addTender,
        removeTender,
        finalizeCovered,
        finalizeWithCredit,
        backToSimple,
        // común
        get isPending() {
            return isPending
        },
        get submitError() {
            return submitError
        }
    }
}

export type PaymentController = ReturnType<typeof usePayment>
