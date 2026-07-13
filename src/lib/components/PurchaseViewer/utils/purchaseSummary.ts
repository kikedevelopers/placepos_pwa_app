import type { PurchaseCredit, PurchaseStatus } from '$lib/api/requests/purchases'

/** Tono visual de una etiqueta de estado. */
export type PillTone = 'success' | 'warning' | 'danger'
export type Pill = { label: string; tone: PillTone }

/** Etiqueta de entrega (paridad `DeliveryPill` de placepos). */
export const deliveryPill = (status: PurchaseStatus): Pill =>
    status === 'RECEIVED'
        ? { label: 'Recibida', tone: 'success' }
        : { label: 'Pendiente', tone: 'warning' }

/** Etiqueta de pago (paridad `PaymentPill` de placepos). */
export const paymentPill = (credit: PurchaseCredit | null): Pill => {
    if (!credit || credit.balance <= 0) return { label: 'Pagada', tone: 'success' }
    return credit.status === 'PARTIALLY_PAID'
        ? { label: 'Abono parcial', tone: 'warning' }
        : { label: 'Por pagar', tone: 'danger' }
}

/** Saldo pendiente con el proveedor (0 si no hay crédito). */
export const purchaseBalance = (credit: PurchaseCredit | null): number => credit?.balance ?? 0

/**
 * Monto abonado. Sin crédito se asume la compra pagada de contado → el total.
 * Con crédito, el `paid_amount` acumulado (paridad `PurchaseInfoPanel`).
 */
export const purchasePaid = (credit: PurchaseCredit | null, total: number): number =>
    credit?.paid_amount ?? total

/** Hay saldo pendiente → la compra admite abono. */
export const hasPendingBalance = (credit: PurchaseCredit | null): boolean =>
    purchaseBalance(credit) > 0
