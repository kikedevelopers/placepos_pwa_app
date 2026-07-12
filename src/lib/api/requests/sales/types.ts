// Contratos de ventas (pos_api, camelCase en la respuesta).

export type TicketType = 'ORDER' | 'SALE'

export type SaleListItem = {
    id: number
    ticketType: TicketType
    ticketNumber: string
    saleNumber: string | null
    total: number
    cost: number
    profit: number
    margin: number
    customerName: string
    createdAt: string
}

export type SaleLine = {
    id: number
    name: string
    quantity: number
    price: number
    total: number
    note: string | null
}

export type SalePayment = {
    id: number
    paymentMethod: 'CASH' | 'TRANSFER' | 'CREDIT'
    amountDue: number
    amountPaid: number
    changeAmount: number
    bankName: string | null
    createdAt: string
}

export type SaleCredit = {
    id: number
    totalAmount: number
    paidAmount: number
    balance: number
    dueDate: string
    status: 'PENDING' | 'PARTIAL' | 'PAID'
    createdAt: string
}

// Línea de tiempo de estados de la venta/pedido (pos_api la entrega en
// `statusHistory`, ASC por fecha). Paridad con placepos desktop.
export type SaleStatusEventType =
    | 'CREATED'
    | 'COLLECTED'
    | 'CREDIT_OPENED'
    | 'INSTALLMENT'
    | 'PAID'
    | 'VOIDED'

export type SaleStatusEvent = {
    eventType: SaleStatusEventType
    amount: number | null
    createdBy: string | null
    createdAt: string
}

export type SaleDetail = {
    id: number
    ticketType: TicketType
    ticketNumber: string
    saleNumber: string | null
    total: number
    cost: number
    profit: number
    margin: number
    customerName: string
    notes: string | null
    createdBy: string | null
    createdAt: string
    lines: SaleLine[]
    payments: SalePayment[]
    credit: SaleCredit | null
    // Historial de estados para la Línea de tiempo (solo visible para admin).
    // Opcional por tolerancia a respuestas legadas/caché sin el campo.
    statusHistory?: SaleStatusEvent[]
}

export type SalesListParams = {
    limit?: number
    ticket_type?: TicketType
    date_from?: string
    date_to?: string
}
