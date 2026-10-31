import type { AgentOrder, AgentOrderTicket } from '$lib/api/requests/agentOrders/types'

/** Qué es el ticket hoy: pedido, venta, crédito o préstamo (y si se anuló). */
export const ticketKindLabel = (ticket: AgentOrderTicket): string => {
    if (ticket.is_voided) return 'Anulado'
    if (ticket.type === 'ORDER') return 'Pedido'
    if (ticket.type === 'LOAN') return 'Préstamo'
    return ticket.is_credit ? 'Crédito' : 'Venta'
}

export interface OrderActions {
    /** Acción principal: ver el ticket vivo, llevarlo al POS, o ninguna. */
    primary: 'ticket' | 'pos' | null
    canMarkTaken: boolean
    canDismiss: boolean
    canReturnPending: boolean
    /** Por qué no se puede devolver a "por tomar" (está en un ticket vivo). */
    returnBlockedReason: string | null
}

/**
 * Acciones del pedido (mismas reglas que la barra de placepos):
 *   - En un ticket vivo: lo principal es verlo; no se puede devolver a por
 *     tomar hasta anular ese ticket.
 *   - Por tomar: llevarlo al POS (si el usuario vende), tomarlo o descartarlo.
 *   - Tomado o descartado sin ticket vivo: se puede devolver a por tomar.
 */
export const orderActions = (
    order: Pick<AgentOrder, 'status' | 'ticket'>,
    canUsePos: boolean
): OrderActions => {
    const liveTicket = order.ticket && !order.ticket.is_voided ? order.ticket : null
    const pending = order.status === 'pending'
    return {
        primary: liveTicket ? 'ticket' : pending && canUsePos ? 'pos' : null,
        canMarkTaken: pending,
        canDismiss: pending,
        canReturnPending: !pending && !liveTicket,
        returnBlockedReason:
            !pending && liveTicket ? `Está en ${liveTicket.number}: anúlalo para devolverlo` : null
    }
}

/** Texto del estado tras tomarlo o descartarlo ("Tomado por Ana · …"). */
export const statusTrail = (
    order: Pick<AgentOrder, 'status' | 'cancelled_by_customer' | 'status_changed_by'>
): string => {
    const base =
        order.status === 'taken'
            ? 'Tomado'
            : order.cancelled_by_customer
              ? 'Cancelado por el cliente'
              : order.status === 'dismissed'
                ? 'Descartado'
                : 'Por tomar'
    return order.status_changed_by ? `${base} por ${order.status_changed_by}` : base
}

/** Etiqueta de la pastilla de estado (el descarte del cliente se distingue). */
export const statusPillLabel = (
    order: Pick<AgentOrder, 'status' | 'cancelled_by_customer'>
): string =>
    order.status === 'pending'
        ? 'Por tomar'
        : order.status === 'taken'
          ? 'Tomado'
          : order.cancelled_by_customer
            ? 'Cancelado por el cliente'
            : 'Descartado'
