import { formatCurrency } from '$lib/utils/numbers'
import type { AgentOrder } from '$lib/api/requests/agentOrders/types'
import { AGENT_ORDERS_PATH, agentOrderPath } from '../constants'

// Eventos de tiempo real del agente (`agent-orders:changed`). Funciones puras,
// espejo de `hooks/useAgentOrders.ts` de placepos.

/** Evento de tiempo real que merece un aviso (no un simple cambio de estado). */
export interface AgentOrderEvent {
    /**
     * created = pedido nuevo; updated = el cliente lo cambió; cancelled = el
     * cliente lo canceló; request = pidió algo sobre uno ya tomado.
     */
    kind: 'created' | 'updated' | 'cancelled' | 'request'
    reference: string
    /** Id del pedido (para abrirlo); servidor viejo: no viene. */
    order_id?: number
    /**
     * Solo en el aviso al DUEÑO (llega aunque esté en otra sucursal): dónde
     * pasó y lo justo para la notificación sin pedir el pedido.
     */
    company_id?: number
    company_name?: string
    customer_name?: string | null
    total?: number
    items_count?: number
}

const EVENT_KINDS: Record<string, AgentOrderEvent['kind']> = {
    created: 'created',
    updated: 'updated',
    cancelled: 'cancelled',
    customer_request: 'request'
}

/**
 * Lee el evento `agent-orders:changed`: devuelve qué avisar, o `null` si es un
 * cambio de estado hecho por el negocio (o un payload raro).
 */
export const agentOrderEventOf = (payload: unknown): AgentOrderEvent | null => {
    if (!payload || typeof payload !== 'object') return null
    const raw = payload as Record<string, unknown>
    const kind = typeof raw.reason === 'string' ? EVENT_KINDS[raw.reason] : undefined
    if (!kind) return null
    const id = Number(raw.order_id)
    const companyId = Number(raw.company_id)
    return {
        kind,
        reference: typeof raw.reference === 'string' ? raw.reference.trim() : '',
        ...(Number.isSafeInteger(id) && id > 0 ? { order_id: id } : {}),
        ...(Number.isSafeInteger(companyId) && companyId > 0 ? { company_id: companyId } : {}),
        ...(typeof raw.company_name === 'string' && raw.company_name.trim()
            ? { company_name: raw.company_name.trim() }
            : {}),
        ...(typeof raw.customer_name === 'string' ? { customer_name: raw.customer_name } : {}),
        ...(typeof raw.total === 'number' ? { total: raw.total } : {}),
        ...(typeof raw.items_count === 'number' ? { items_count: raw.items_count } : {})
    }
}

const SYSTEM_TITLE: Record<AgentOrderEvent['kind'], string> = {
    created: 'Nuevo pedido del agente',
    updated: 'Pedido actualizado por el cliente',
    cancelled: 'El cliente canceló su pedido',
    request: 'El cliente pide un cambio'
}

/** Lo que muestra el aviso: título, cuerpo y a dónde lleva al tocarlo. */
export interface AgentSystemNotification {
    title: string
    body: string
    route: string
}

/**
 * Aviso (toast en la app) para un evento del agente. Con el pedido a mano,
 * dice quién, cuánto y cuántos productos; sin él, al menos la referencia. El
 * clic abre el pedido en Informes → Agente.
 */
export const agentSystemNotification = (
    event: AgentOrderEvent,
    order?: Pick<AgentOrder, 'customer_name' | 'chat_display_name' | 'total' | 'items_count'> | null
): AgentSystemNotification => {
    const route = event.order_id ? agentOrderPath(event.order_id) : AGENT_ORDERS_PATH
    if (!order) {
        return {
            title: SYSTEM_TITLE[event.kind],
            body: event.reference ? `Pedido ${event.reference}` : 'Revisa los pedidos del agente.',
            route
        }
    }
    const who = order.customer_name?.trim() || order.chat_display_name?.trim() || 'Un cliente'
    const products = order.items_count === 1 ? '1 producto' : `${order.items_count} productos`
    const parts = [who, formatCurrency(order.total), products, event.reference].filter(Boolean)
    return { title: SYSTEM_TITLE[event.kind], body: parts.join(' · '), route }
}

/**
 * Referencia del pedido NUEVO que trae el evento de tiempo real, o `null` si el
 * evento no es una llegada (cambio de estado) o viene malformado.
 */
export const arrivedOrderReference = (payload: unknown): string | null => {
    if (!payload || typeof payload !== 'object') return null
    const { reason, reference } = payload as { reason?: unknown; reference?: unknown }
    if (reason !== 'created') return null
    return typeof reference === 'string' && reference.trim() ? reference.trim() : ''
}

/** Ruta que, desde una notificación del sistema, abre el centro de notificaciones. */
export const OPEN_NOTIFICATIONS_ROUTE = '/?notifications=open'

/** ¿El evento pasó en OTRO negocio del dueño (no en el que está)? */
export const isOtherBranchEvent = (
    event: AgentOrderEvent,
    currentCompanyId?: number | null
): boolean => Boolean(event.company_id && currentCompanyId && event.company_id !== currentCompanyId)

/**
 * Notificación del sistema de un pedido de OTRA sucursal: lleva el nombre de la
 * sucursal y los datos del aviso (ese pedido no se puede pedir desde el negocio
 * actual). El clic abre el centro de notificaciones.
 */
export const otherBranchSystemNotification = (event: AgentOrderEvent): AgentSystemNotification => {
    const base = agentSystemNotification(
        event,
        typeof event.total === 'number'
            ? {
                  customer_name: event.customer_name ?? null,
                  chat_display_name: null,
                  total: event.total,
                  items_count: event.items_count ?? 0
              }
            : null
    )
    return {
        title: `${base.title} · ${event.company_name ?? 'otra sucursal'}`,
        body: base.body,
        route: OPEN_NOTIFICATIONS_ROUTE
    }
}

/**
 * Un mismo evento puede llegar dos veces (por el negocio y por el dueño): se
 * deja pasar una sola vez en `windowMs`.
 */
export const createEventDeduper = (windowMs = 15_000) => {
    const seen = new Map<string, number>()
    return (event: AgentOrderEvent, now: number = Date.now()): boolean => {
        for (const [key, at] of seen) if (now - at > windowMs) seen.delete(key)
        const key = `${event.kind}:${event.order_id ?? event.reference}`
        if (seen.has(key)) return false
        seen.set(key, now)
        return true
    }
}
