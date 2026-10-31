/** Ruta de Reportes → Agente (pedidos que cierra el agente de ventas). */
export const AGENT_ORDERS_PATH = '/reportes?tab=agente'

/** Abre ese pedido en Reportes → Agente. */
export const agentOrderPath = (orderId: number): string => `${AGENT_ORDERS_PATH}&order=${orderId}`

/** Pedidos por página de la bandeja (scroll infinito). */
export const AGENT_ORDERS_PAGE_SIZE = 25

/** Query keys: todo cuelga de `['agent-orders']` para invalidar de un golpe. */
export const AGENT_ORDERS_KEYS = {
    all: ['agent-orders'] as const,
    list: (params: Record<string, unknown>) => ['agent-orders', 'list', params] as const,
    pendingCount: ['agent-orders', 'pending-count'] as const
}

/** Evento de tiempo real que emite pos_api al llegar o cambiar un pedido. */
export const AGENT_ORDERS_EVENT = 'agent-orders:changed'
