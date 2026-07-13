import type { PurchasePaymentSource } from '$lib/api/requests/purchases'
import { roundTo } from '$lib/utils/numbers'

// ─── Abono ───────────────────────────────────────────────────────────────────

/**
 * Descompone un `source_key` ("wallet-3") en su tipo e id numéricos. Misma
 * convención que el `PaymentMethodSelect` de gastos.
 */
export const splitSourceKey = (
    key: string
): { source_type: PurchasePaymentSource; source_id: number } => {
    const idx = key.lastIndexOf('-')
    const source_type = key.slice(0, idx) as PurchasePaymentSource
    const source_id = Number.parseInt(key.slice(idx + 1), 10)
    return { source_type, source_id }
}

/** El monto del abono no puede superar el saldo pendiente (paridad backend 422). */
export const abonoExceedsBalance = (amount: number, balance: number): boolean =>
    amount > roundTo(balance, 2)

/**
 * ¿El formulario de abono es válido? Requiere fuente seleccionada, monto > 0
 * que no exceda el saldo, y que no haya una petición en curso.
 */
export const canSubmitAbono = (params: {
    amount: number
    balance: number
    sourceKey: string
    pending: boolean
}): boolean =>
    !params.pending &&
    params.amount > 0 &&
    !abonoExceedsBalance(params.amount, params.balance) &&
    params.sourceKey.length > 0

// ─── Recepción ───────────────────────────────────────────────────────────────

/**
 * Materializa una fecha `YYYY-MM-DD` a ISO fijando las 12:00 locales, para
 * evitar saltos de día por zona horaria (idéntico a placepos `PurchaseReceiveModal`).
 */
export const receivedAtISO = (dateStr: string): string =>
    new Date(`${dateStr}T12:00:00`).toISOString()

/** El formulario de recepción exige receptor no vacío y fecha presente. */
export const canSubmitReceive = (receivedBy: string, receivedAt: string): boolean =>
    receivedBy.trim().length > 0 && receivedAt.length > 0
