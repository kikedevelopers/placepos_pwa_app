// Datos y contratos del POS (paridad placepos / pos_api).

export type PosPrice = {
    id: number
    sale_price: number
    profit: number
    margin: number
}

export type PosProduct = {
    id: number
    name: string
    cost: number
    bar_code: string
    sku_code: string
    packaging_id: number | null
    packaging: { id: number; name: string; value: number } | null
    prices: PosPrice[]
    parent: { id: number; name: string; cost: number } | null
    stock: number
}

export type PosCustomer = {
    id: number
    name: string
    address?: string | null
}

export type PosBank = {
    id: number
    name: string
}

// ---- POST /sales (crear pedido ORDER) ----
export type SaleLinePayload = {
    item_id: number
    name: string
    cost: number
    price: number
    quantity: number
    total: number
    profit: number
    margin: number
    price_mode: 'fixed' | 'manual'
    price_position: number | null
    note: string | null
}

export type CreateSalePayload = {
    items: SaleLinePayload[]
    total: number
    cost: number
    profit: number
    margin: number
    customer_id: number | null
    customer_name: string | null
}

export type CreateSaleResult = {
    success: boolean
    message: string
    invoice_id: number
    ticket_number: string
}

// ---- POST /payments (cobrar ORDER → SALE) ----
export type PaymentMethod = 'CASH' | 'TRANSFER' | 'CREDIT'

export type ProcessPaymentPayload = {
    invoice_id: number
    payment_method: PaymentMethod
    amount_due: number
    amount_paid: number
    change_amount: number
    is_credit: boolean
    credit_amount: number
    due_date: string | null
    bank_id: number | null
    bank_name: string | null
    client_operation_id: string
    override_margin?: boolean
    override_stock?: boolean
}

export type ProcessPaymentResult = {
    success: boolean
    message: string
    payment_id: number | null
    credit_id: number | null
    sale_number: string | null
}
