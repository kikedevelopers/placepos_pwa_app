import api from '$lib/api/config'
import type { ApiPayload } from '$lib/api/requests/dashboard/types'

export type AlertType = 'INACTIVE_CUSTOMER'

/** Configuración de una alerta (espejo de `/alert-configs/:type` en pos_api). */
export type AlertConfig = {
    id: number
    alert_type: string
    is_enabled: boolean
    /** HH:mm:ss */
    check_time: string
    params: Record<string, unknown>
    last_run_at: string | null
    created_at: string
    updated_at: string
}

export type AlertConfigUpdatePayload = {
    is_enabled: boolean
    /** HH:mm:ss (24h) */
    check_time: string
    params: Record<string, unknown>
}

export const getAlertConfig = async (type: AlertType): Promise<AlertConfig> => {
    const response = await api.get<ApiPayload<AlertConfig>>(`/alert-configs/${type}`)
    return response.data.payload
}

export const updateAlertConfig = async (
    type: AlertType,
    payload: AlertConfigUpdatePayload
): Promise<AlertConfig> => {
    const response = await api.put<ApiPayload<AlertConfig>>(`/alert-configs/${type}`, payload)
    return response.data.payload
}
