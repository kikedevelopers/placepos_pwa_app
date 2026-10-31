import {
    ALERT_TYPE_AGENT_ORDER_PREFIX,
    ALERT_TYPE_FIXED_EXPENSE_DUE,
    ALERT_TYPE_INACTIVE_CUSTOMER,
    type AppAlert
} from '$lib/api/requests/appAlerts/types'
import {
    bogotaDayNumber,
    bogotaParts,
    shortDateLabel,
    timeLabel,
    weekdayName
} from '$lib/utils/bogotaTime'
import { agentOrderPath } from '$lib/modules/AgentOrders/constants'

// Lógica pura del centro de notificaciones (sin DOM) para poder probarla.
// Espejo de `components/NotificationsModal/utils/notifications.ts` de placepos.

export type NotificationCategory = 'orders' | 'expenses' | 'customers' | 'other'

export const CATEGORY_LABEL: Record<NotificationCategory, string> = {
    orders: 'Pedidos',
    expenses: 'Gastos',
    customers: 'Clientes',
    other: 'Otras'
}

export const categoryOf = (alert: Pick<AppAlert, 'alert_type'>): NotificationCategory => {
    if (alert.alert_type.startsWith(ALERT_TYPE_AGENT_ORDER_PREFIX)) return 'orders'
    if (alert.alert_type === ALERT_TYPE_FIXED_EXPENSE_DUE) return 'expenses'
    if (alert.alert_type === ALERT_TYPE_INACTIVE_CUSTOMER) return 'customers'
    return 'other'
}

/** Variante visual del evento (icono y tinte). */
export type NotificationTone =
    | 'order'
    | 'order-updated'
    | 'order-cancelled'
    | 'order-request'
    | 'expense'
    | 'customer'
    | 'neutral'

export const toneOf = (alert: AppAlert): NotificationTone => {
    switch (alert.alert_type) {
        case 'AGENT_ORDER_NEW':
            return 'order'
        case 'AGENT_ORDER_UPDATED':
            return 'order-updated'
        case 'AGENT_ORDER_CANCELLED':
            return 'order-cancelled'
        case 'AGENT_ORDER_REQUEST':
            return 'order-request'
        case ALERT_TYPE_FIXED_EXPENSE_DUE:
            return 'expense'
        case ALERT_TYPE_INACTIVE_CUSTOMER:
            return 'customer'
        default:
            return 'neutral'
    }
}

const FALLBACK_TITLE: Record<string, string> = {
    AGENT_ORDER_NEW: 'Nuevo pedido del agente',
    AGENT_ORDER_UPDATED: 'Pedido actualizado por el cliente',
    AGENT_ORDER_CANCELLED: 'El cliente canceló su pedido',
    AGENT_ORDER_REQUEST: 'El cliente pide un cambio',
    [ALERT_TYPE_FIXED_EXPENSE_DUE]: 'Gasto fijo por pagar',
    [ALERT_TYPE_INACTIVE_CUSTOMER]: 'Clientes inactivos'
}

/** Título de la notificación (servidor viejo sin `title`: uno por tipo). */
export const titleOf = (alert: AppAlert): string =>
    alert.title?.trim() || FALLBACK_TITLE[alert.alert_type] || 'Notificación'

/**
 * Nombre de la sucursal donde pasó, si NO es el negocio en el que está el
 * usuario (en el mismo negocio no hace falta decirlo). `null` = es de aquí.
 */
export const otherBranchOf = (alert: AppAlert, currentCompanyId?: number | null): string | null => {
    if (!currentCompanyId || !alert.company_id || alert.company_id === currentCompanyId) return null
    return alert.company_name?.trim() || 'otra sucursal'
}

/**
 * A dónde lleva la notificación al abrirla, o `null` si no lleva a ningún lado.
 * Pedido del agente → el informe con ese pedido; gasto fijo → su ficha. Lo de
 * otra sucursal no se abre desde aquí: hay que cambiarse a esa sucursal.
 */
export const targetOf = (alert: AppAlert, currentCompanyId?: number | null): string | null => {
    if (otherBranchOf(alert, currentCompanyId)) return null
    const payload = alert.payload ?? {}
    if (categoryOf(alert) === 'orders' && typeof payload.order_id === 'number') {
        return agentOrderPath(payload.order_id)
    }
    if (
        alert.alert_type === ALERT_TYPE_FIXED_EXPENSE_DUE &&
        typeof payload.fixed_expense_id === 'number'
    ) {
        return `/gastos?tab=fixed&highlight=${payload.fixed_expense_id}`
    }
    return null
}

export interface NotificationGroup {
    label: string
    alerts: AppAlert[]
}

/**
 * Agrupa por día del negocio (Bogotá): Hoy, Ayer, Esta semana (últimos 7
 * días) y Anteriores. Mantiene el orden (lo más reciente primero) y omite los
 * grupos vacíos. `now` se inyecta en los tests.
 */
export const groupByDay = (
    alerts: readonly AppAlert[],
    now: Date = new Date()
): NotificationGroup[] => {
    const today = bogotaDayNumber(now) ?? 0
    const buckets: NotificationGroup[] = [
        { label: 'Hoy', alerts: [] },
        { label: 'Ayer', alerts: [] },
        { label: 'Esta semana', alerts: [] },
        { label: 'Anteriores', alerts: [] }
    ]
    for (const alert of alerts) {
        const day = bogotaDayNumber(alert.triggered_at)
        const diff = day === null ? 7 : today - day
        const index = diff <= 0 ? 0 : diff === 1 ? 1 : diff < 7 ? 2 : 3
        buckets[index].alerts.push(alert)
    }
    return buckets.filter((group) => group.alerts.length > 0)
}

/**
 * Hora compacta para la fila: "ahora", "hace 5 min", "hace 2 h", la hora si es
 * de hoy ("9:41 a. m."), "ayer", el día de la semana o la fecha.
 */
export const compactTime = (iso: string, now: Date = new Date()): string => {
    const parts = bogotaParts(iso)
    if (!parts) return ''
    const minutes = Math.floor((now.getTime() - new Date(iso).getTime()) / 60_000)
    if (minutes < 1) return 'ahora'
    if (minutes < 60) return `hace ${minutes} min`
    if (minutes < 6 * 60) return `hace ${Math.floor(minutes / 60)} h`
    const days = bogotaDayNumber(now)! - bogotaDayNumber(iso)!
    if (days === 0) return timeLabel(parts)
    if (days === 1) return 'ayer'
    if (days < 7) return weekdayName(parts)
    return shortDateLabel(parts, parts.year !== bogotaParts(now)!.year)
}

/** Cuántas hay por categoría (para los filtros). */
export const countByCategory = (
    alerts: readonly AppAlert[]
): Record<NotificationCategory, number> => {
    const counts: Record<NotificationCategory, number> = {
        orders: 0,
        expenses: 0,
        customers: 0,
        other: 0
    }
    for (const alert of alerts) counts[categoryOf(alert)] += 1
    return counts
}

/** Las leídas se muestran solo si son de los últimos días (igual que el servidor). */
export const READ_RETENTION_DAYS = 7

/**
 * ¿Va en el historial ("Todas")? Las no leídas, siempre; las leídas, solo las
 * de los últimos `READ_RETENTION_DAYS` días. Respaldo del filtro del servidor
 * (un servidor viejo las manda todas).
 */
export const isInHistory = (
    alert: Pick<AppAlert, 'is_read' | 'triggered_at'>,
    now: Date = new Date()
): boolean => {
    if (!alert.is_read) return true
    const at = Date.parse(alert.triggered_at)
    return Number.isFinite(at) && now.getTime() - at <= READ_RETENTION_DAYS * 24 * 60 * 60 * 1000
}
