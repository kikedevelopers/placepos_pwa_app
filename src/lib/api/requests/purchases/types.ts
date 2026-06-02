// Paridad con placepos (api/requests/purchase/types.ts), solo lo necesario para
// el informe. El listado de pos_api trae cabecera + credit (lines/payments vacíos).

export type PurchaseCreditStatus = 'PENDING' | 'PARTIALLY_PAID' | 'PAID'

export type PurchaseCredit = {
    id: number
    total_amount: number
    paid_amount: number
    balance: number
    status: PurchaseCreditStatus
}

export type Purchase = {
    id: number
    purchase_number: string
    supplier_id: number
    supplier_name: string
    subtotal: number
    iva_total: number
    total: number
    status: 'PENDING' | 'RECEIVED'
    carrier_name: string | null
    invoice_number: string | null
    created_by: string | null
    is_deleted: boolean
    created_at: string
    credit: PurchaseCredit | null
}
