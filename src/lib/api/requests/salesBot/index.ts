import api from '$lib/api/config'
import type { ApiPayload } from '$lib/api/requests/dashboard/types'
import type {
    SalesBotConfig,
    SalesBotSettings,
    UpdateSalesBotConfigPayload,
    UpdateSalesBotSettingsPayload,
    UpdateWhatsappConfigPayload,
    ValidateSalesBotTokenResult,
    WhatsappBotConfig
} from './types'

/**
 * ¿El negocio tiene el asistente de ventas habilitado? Lo habilita el panel
 * superadmin por negocio. Sin acceso, todo lo del asistente se oculta.
 */
export const getSalesAgentAccess = async (): Promise<{ enabled: boolean }> => {
    const response = await api.get<ApiPayload<{ enabled?: unknown }>>('/sales-bot/access')
    return { enabled: response.data.payload?.enabled === true }
}

/** Config del bot de Telegram del negocio (sin el token). */
export const getSalesBotConfig = async (): Promise<SalesBotConfig> => {
    const response = await api.get<ApiPayload<SalesBotConfig>>('/sales-bot/config')
    return response.data.payload
}

/** Guarda la config del bot. Si cambia el token, el servidor lo valida. */
export const updateSalesBotConfig = async (
    payload: UpdateSalesBotConfigPayload
): Promise<SalesBotConfig> => {
    const response = await api.put<ApiPayload<SalesBotConfig>>('/sales-bot/config', payload)
    return response.data.payload
}

/** Verifica un token de Telegram contra getMe, sin guardarlo. */
export const validateSalesBotToken = async (
    token: string
): Promise<ValidateSalesBotTokenResult> => {
    const response = await api.post<ApiPayload<ValidateSalesBotTokenResult>>(
        '/sales-bot/validate-token',
        { token }
    )
    return response.data.payload
}

/** Config de WhatsApp del negocio (sin el token). */
export const getWhatsappConfig = async (): Promise<WhatsappBotConfig> => {
    const response = await api.get<ApiPayload<WhatsappBotConfig>>('/sales-bot/whatsapp/config')
    return response.data.payload
}

/** Guarda la config de WhatsApp. */
export const updateWhatsappConfig = async (
    payload: UpdateWhatsappConfigPayload
): Promise<WhatsappBotConfig> => {
    const response = await api.put<ApiPayload<WhatsappBotConfig>>(
        '/sales-bot/whatsapp/config',
        payload
    )
    return response.data.payload
}

/** Ajustes de comportamiento del agente. */
export const getSalesBotSettings = async (): Promise<SalesBotSettings> => {
    const response = await api.get<ApiPayload<SalesBotSettings>>('/sales-bot/settings')
    return response.data.payload
}

export const updateSalesBotSettings = async (
    payload: UpdateSalesBotSettingsPayload
): Promise<SalesBotSettings> => {
    const response = await api.put<ApiPayload<SalesBotSettings>>('/sales-bot/settings', payload)
    return response.data.payload
}

export * from './types'
