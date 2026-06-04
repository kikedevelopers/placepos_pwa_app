import type { MovementType } from '$lib/api/requests/financial-movements/types'

/** Etiquetas legibles de cada concepto de movimiento (fiel a placepos). */
export const CONCEPT_LABELS: Record<string, string> = {
    INITIAL_BALANCE: 'Saldo inicial',
    SALE_PAYMENT: 'Pago de venta',
    SALE: 'Venta',
    CASH_REGISTER_CLOSE: 'Cierre de caja',
    TRANSFER: 'Transferencia',
    PURCHASE: 'Compra',
    PURCHASE_PAYMENT: 'Pago de compra',
    EXPENSE: 'Gasto',
    EXPENSE_PAYMENT: 'Pago de gasto',
    TAX_PAYMENT: 'Pago de impuestos',
    PAYROLL: 'Nómina',
    REFUND: 'Reembolso',
    CREDIT_PAYMENT: 'Abono a crédito',
    CREDIT_NOTE_REFUND: 'Reembolso nota crédito',
    ADJUSTMENT: 'Ajuste',
    CARRIER_PAYMENT: 'Abono a transportista',
    OTHER: 'Otro'
}

/** Tipos de movimiento que suman al saldo (entradas). */
export const POSITIVE_MOVEMENT_TYPES: MovementType[] = ['INCOME', 'TRANSFER']

export const isPositiveMovement = (type: MovementType): boolean =>
    POSITIVE_MOVEMENT_TYPES.includes(type)

export const conceptLabel = (concept: string): string => CONCEPT_LABELS[concept] ?? concept
