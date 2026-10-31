import api from '$lib/api/config'
import type { ApiPayload } from '$lib/api/requests/dashboard/types'
import type {
    AgentOrder,
    AgentOrdersList,
    AgentOrdersQuery,
    UpdateAgentOrderStatusPayload
} from './types'

/** Bandeja de pedidos del agente (por estado, rango y búsqueda) + resumen. */
export const getAgentOrders = async (query: AgentOrdersQuery): Promise<AgentOrdersList> => {
    const params: Record<string, string | number> = { status: query.status }
    if (query.from && query.to) {
        params.from = query.from
        params.to = query.to
    }
    const search = query.search?.trim()
    if (search) params.search = search
    if (query.page) params.page = query.page
    if (query.limit) params.limit = query.limit
    const response = await api.get<ApiPayload<AgentOrdersList>>('/sales-agent-orders', { params })
    return response.data.payload
}

/** Pedidos del agente por tomar (badge de Reportes). */
export const getAgentOrdersPendingCount = async (): Promise<number> => {
    const response = await api.get<ApiPayload<{ count?: unknown }>>(
        '/sales-agent-orders/pending-count'
    )
    const count = Number(response.data.payload?.count)
    return Number.isFinite(count) && count > 0 ? count : 0
}

/** Un pedido del agente (lo carga el POS en "Llevar al POS"). */
export const getAgentOrder = async (id: number): Promise<AgentOrder> => {
    const response = await api.get<ApiPayload<AgentOrder>>(`/sales-agent-orders/${id}`)
    return response.data.payload
}

/** Marca el pedido como tomado, descartado o de nuevo por tomar. */
export const updateAgentOrderStatus = async (
    id: number,
    payload: UpdateAgentOrderStatusPayload
): Promise<AgentOrder> => {
    const response = await api.patch<ApiPayload<AgentOrder>>(
        `/sales-agent-orders/${id}/status`,
        payload
    )
    return response.data.payload
}

/** Enlaza el pedido con el ticket que se registró en el POS (queda tomado). */
export const linkAgentOrderTicket = async (
    id: number,
    saleInvoiceId: number
): Promise<AgentOrder> => {
    const response = await api.post<ApiPayload<AgentOrder>>(
        `/sales-agent-orders/${id}/link-ticket`,
        { sale_invoice_id: saleInvoiceId }
    )
    return response.data.payload
}

export * from './types'
