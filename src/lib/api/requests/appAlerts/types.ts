/**
 * Notificaciones de la campana (`/app-alerts` de pos_api). Espejo de
 * `api/requests/alerts/types.ts` de placepos.
 */
export interface AppAlertPayload {
    message: string
    // INACTIVE_CUSTOMER:
    customer_ids?: number[]
    customer_names?: string[]
    inactivity_days?: number
    // FIXED_EXPENSE_DUE:
    fixed_expense_id?: number
    fixed_expense_name?: string
    period_number?: number
    amount?: number
    due_at?: string
    // AGENT_ORDER_* (pedidos del agente de ventas):
    order_id?: number
    reference?: string
    total?: number
    items_count?: number
    customer_name?: string | null
    channel?: string
    event?: 'new' | 'updated' | 'cancelled' | 'request'
    detail?: string
}

export const ALERT_TYPE_INACTIVE_CUSTOMER = 'INACTIVE_CUSTOMER' as const
export const ALERT_TYPE_FIXED_EXPENSE_DUE = 'FIXED_EXPENSE_DUE' as const
/** Prefijo de las alertas de pedidos del agente de ventas. */
export const ALERT_TYPE_AGENT_ORDER_PREFIX = 'AGENT_ORDER_' as const

export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL'

export interface AppAlert {
    id: number
    alert_type: string
    /** Título corto. Servidor viejo: no viene (la UI usa uno por tipo). */
    title?: string
    severity?: AlertSeverity
    /** Negocio de la alerta: un dueño ve los pedidos del agente de sus sucursales. */
    company_id?: number
    company_name?: string | null
    payload: AppAlertPayload
    is_read: boolean
    read_at: string | null
    triggered_at: string
    created_at: string
}

export interface AppAlertsList {
    alerts: AppAlert[]
    unread_count: number
}
