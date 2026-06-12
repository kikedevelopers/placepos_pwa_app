import api from '$lib/api/config'
import type { ApiPayload } from '$lib/api/requests/dashboard/types'

export type TicketSettingType =
    | 'ORDER'
    | 'SALE'
    | 'CREDIT_NOTE'
    | 'DEBIT_NOTE'
    | 'PURCHASE'
    | 'PURCHASE_PAYMENT'

/**
 * Consecutivo por tipo de documento (espejo de `/ticket-settings` en pos_api).
 * pos_api NO devuelve `next_preview`; se construye en el cliente.
 */
export type TicketSetting = {
    id: number
    ticket_type: TicketSettingType
    prefix: string | null
    suffix: string | null
    current_number: number
    created_at: string
    updated_at: string
}

export type UpdateTicketSettingPayload = {
    prefix?: string | null
}

/** Lista los consecutivos configurados de la company. */
export const getTicketSettings = async (): Promise<TicketSetting[]> => {
    const response = await api.get<ApiPayload<TicketSetting[]>>('/ticket-settings')
    return response.data.payload
}

/** Actualiza el prefijo de un consecutivo (solo afecta a los próximos folios). */
export const updateTicketSetting = async (
    id: number,
    payload: UpdateTicketSettingPayload
): Promise<TicketSetting> => {
    const response = await api.put<ApiPayload<TicketSetting>>(`/ticket-settings/${id}`, payload)
    return response.data.payload
}
