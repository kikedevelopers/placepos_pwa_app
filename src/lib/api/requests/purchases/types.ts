// Paridad con placepos (api/requests/purchase/types.ts). El LISTADO de pos_api
// trae cabecera + credit (lines/payments vacíos); el DETALLE (GET /purchases/:id)
// trae además `lines`, `payments`, `carrier` y `carrier_credit`.

export type PurchaseStatus = 'PENDING' | 'RECEIVED'
export type PurchaseCreditStatus = 'PENDING' | 'PARTIALLY_PAID' | 'PAID'
export type PurchasePaymentMethod = 'CASH' | 'TRANSFER'
export type PurchasePaymentSource = 'wallet' | 'bank' | 'cash_register'

export type PurchaseCredit = {
    id: number
    total_amount: number
    paid_amount: number
    balance: number
    status: PurchaseCreditStatus
}

/** Cabecera de compra (listado). */
export type Purchase = {
    id: number
    purchase_number: string
    supplier_id: number
    supplier_name: string
    subtotal: number
    iva_total: number
    total: number
    status: PurchaseStatus
    carrier_name: string | null
    invoice_number: string | null
    created_by: string | null
    is_deleted: boolean
    created_at: string
    credit: PurchaseCredit | null
}

/** Línea/ítem de una compra. */
export type PurchaseLine = {
    id: number
    purchase_id: number
    product_id: number
    supplier_id: number
    name: string
    packaging_id: number | null
    packaging_name: string | null
    packaging_value: number | null
    packaging_qty: number
    unit_qty: number
    unit_price: number
    packaging_price: number
    iva_rate: number
    subtotal: number
    iva_amount: number
    total: number
    created_at: string
}

/** Abono registrado a la compra (pago al proveedor). */
export type PurchasePayment = {
    id: number
    purchase_id: number
    payment_number: string
    payment_method: PurchasePaymentMethod
    amount: number
    bank_id: number | null
    bank_name: string | null
    source_type: PurchasePaymentSource | null
    source_id: number | null
    notes: string | null
    created_by: string | null
    created_by_id: number | null
    created_at: string
}

/** Snapshot del transportista asociado a la compra. */
export type PurchaseCarrier = {
    id: number
    name: string
    identification: string | null
    phone: string | null
    email: string | null
}

export type PurchaseCarrierCreditStatus = 'PENDING' | 'PARTIAL' | 'PAID'

/**
 * Deuda/flete con el transportista. `payments` llega siempre vacío desde el
 * cloud (pos_api aún no modela el historial de abonos al transportista); solo
 * se conoce el saldo agregado.
 */
export type PurchaseCarrierCredit = {
    id: number
    purchase_id: number
    carrier_id: number
    total: number
    paid_amount: number
    balance: number
    status: PurchaseCarrierCreditStatus
    payments: never[]
    created_at: string
}

/** Detalle completo de una compra (GET /purchases/:id). */
export type PurchaseDetail = Purchase & {
    notes: string | null
    carrier_id: number | null
    transport_cost: number
    total_kilos: number | null
    received_by: string | null
    received_at: string | null
    invoice_date: string | null
    updated_at: string
    lines: PurchaseLine[]
    payments: PurchasePayment[]
    carrier?: PurchaseCarrier | null
    carrier_credit?: PurchaseCarrierCredit | null
}

/** Payload de `POST /purchases/:id/payments` (abono al proveedor). */
export type AddPurchasePaymentPayload = {
    source_type: PurchasePaymentSource
    source_id: number
    amount: number
    notes?: string | null
    // Idempotency key (opcional): el backend deduplica por (company_id, uuid).
    uuid?: string
}

/** Payload de `PUT /purchases/:id/receive` (marcar como recibida). */
export type ReceivePurchasePayload = {
    received_by: string
    received_at?: string | null
    client_operation_id?: string | null
}
