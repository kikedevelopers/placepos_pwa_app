import api from '$lib/api/config'
import type { ApiPayload } from '$lib/api/requests/dashboard/types'
import type { AppAlertsList } from './types'

/** Notificaciones del usuario (las del negocio y, si es dueño, las de sus sucursales). */
export const getAppAlerts = async (unreadOnly: boolean): Promise<AppAlertsList> => {
    const response = await api.get<ApiPayload<AppAlertsList>>('/app-alerts', {
        params: { unread_only: unreadOnly }
    })
    return response.data.payload
}

/** Cuántas sin leer (badge de la campana). */
export const getUnreadAlertsCount = async (): Promise<number> => {
    const response = await api.get<ApiPayload<{ count?: unknown }>>('/app-alerts/unread-count')
    const count = Number(response.data.payload?.count)
    return Number.isFinite(count) && count > 0 ? count : 0
}

export const markAlertRead = async (id: number): Promise<void> => {
    await api.put(`/app-alerts/${id}/read`)
}

export const markAllAlertsRead = async (): Promise<number> => {
    const response = await api.put<ApiPayload<{ marked_count?: unknown }>>('/app-alerts/read-all')
    return Number(response.data.payload?.marked_count) || 0
}

export * from './types'
