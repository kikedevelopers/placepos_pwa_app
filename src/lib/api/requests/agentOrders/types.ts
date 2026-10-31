/**
 * Pedidos que cierra el agente de ventas en un chat (`GET /sales-agent-orders`).
 * Espejo del `AgentOrderView` de pos_api. NO son ventas del POS: son la bandeja
 * del informe "Agente", de donde el negocio los toma para facturarlos.
 */

/** `pending` = por tomar; `taken` = tomado; `dismissed` = descartado. */
export type AgentOrderStatus = 'pending' | 'taken' | 'dismissed'

export type AgentOrderStatusFilter = AgentOrderStatus | 'all'

export interface AgentOrderItem {
    product_id: number
    name: string
    /** Decimal exacto como texto (4 decimales). */
    quantity: string
    unit_price: string
    total: string
}

export interface AgentOrder {
    id: number
    reference: string
    status: AgentOrderStatus
    /** Canal de la conversación: `telegram`, `whatsapp` (Cloud API) o `whatsapp-web` (QR). */
    channel: string
    /** Cuenta del negocio que atendió (`@usuario_bot`, número de WhatsApp). */
    channel_account: string | null
    chat_id: string
    chat_display_name: string | null
    /** Número del cliente según el canal (WhatsApp). */
    chat_phone: string | null
    customer_name: string | null
    customer_phone: string | null
    delivery_mode: 'domicilio' | 'recoger'
    delivery_address: string | null
    payment_method: string | null
    notes: string | null
    items: AgentOrderItem[]
    items_count: number
    total: number
    status_note: string | null
    status_changed_at: string | null
    status_changed_by: string | null
    /** Ticket del POS donde se registró (consecutivo vigente). Servidor viejo: no viene. */
    ticket?: AgentOrderTicket | null
    /** Última vez que el cliente lo modificó (antes de que lo tomaran). */
    customer_updated_at?: string | null
    /** Lo canceló el cliente (no el negocio). */
    cancelled_by_customer?: boolean
    /** Solicitud del cliente sobre el pedido ya tomado (cambiar o cancelar). */
    customer_request?: string | null
    customer_request_at?: string | null
    created_at: string
}

/**
 * Ticket del POS enlazado. `number` es el consecutivo VIGENTE: PED-x mientras
 * sea pedido, VTA-x al cobrarse (`is_credit` si quedó a crédito).
 */
export interface AgentOrderTicket {
    id: number
    type: 'ORDER' | 'SALE' | 'LOAN'
    number: string
    is_credit: boolean
    is_voided: boolean
}

export interface AgentOrdersSummary {
    pending_count: number
    pending_total: number
    taken_count: number
    taken_total: number
    dismissed_count: number
}

export interface AgentOrdersList {
    items: AgentOrder[]
    total_count: number
    page: number
    limit: number
    summary: AgentOrdersSummary
}

export interface AgentOrdersQuery {
    status: AgentOrderStatusFilter
    from?: string
    to?: string
    search?: string
    page?: number
    limit?: number
}

export interface UpdateAgentOrderStatusPayload {
    status: AgentOrderStatus
    note?: string
}
