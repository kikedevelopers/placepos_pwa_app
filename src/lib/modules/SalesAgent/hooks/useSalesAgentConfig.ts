import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query'
import {
    getSalesBotConfig,
    getSalesBotSettings,
    getWhatsappConfig,
    updateSalesBotConfig,
    updateSalesBotSettings,
    updateWhatsappConfig,
    validateSalesBotToken
} from '$lib/api/requests/salesBot'
import type {
    SalesBotConfig,
    SalesBotSettings,
    UpdateSalesBotConfigPayload,
    UpdateSalesBotSettingsPayload,
    UpdateWhatsappConfigPayload,
    WhatsappBotConfig
} from '$lib/api/requests/salesBot'

export const SALES_BOT_KEYS = {
    settings: ['sales-bot', 'settings'] as const,
    telegram: ['sales-bot', 'config', 'telegram'] as const,
    whatsapp: ['sales-bot', 'config', 'whatsapp'] as const
}

/** Ajustes de comportamiento del agente (iguales en todos los canales). */
export const useAgentSettings = () =>
    createQuery({ queryKey: SALES_BOT_KEYS.settings, queryFn: getSalesBotSettings })

export const useSaveAgentSettings = () => {
    const queryClient = useQueryClient()
    return createMutation({
        mutationFn: (payload: UpdateSalesBotSettingsPayload) => updateSalesBotSettings(payload),
        onSuccess: (saved: SalesBotSettings) => queryClient.setQueryData(SALES_BOT_KEYS.settings, saved)
    })
}

/** Bot de Telegram del negocio (sin el token). */
export const useTelegramConfig = () =>
    createQuery({ queryKey: SALES_BOT_KEYS.telegram, queryFn: getSalesBotConfig })

export const useSaveTelegramConfig = () => {
    const queryClient = useQueryClient()
    return createMutation({
        mutationFn: (payload: UpdateSalesBotConfigPayload) => updateSalesBotConfig(payload),
        onSuccess: (saved: SalesBotConfig) => queryClient.setQueryData(SALES_BOT_KEYS.telegram, saved)
    })
}

export const useValidateTelegramToken = () =>
    createMutation({ mutationFn: (token: string) => validateSalesBotToken(token) })

/** WhatsApp del negocio (el número se conecta por QR desde el escritorio). */
export const useWhatsappConfig = () =>
    createQuery({ queryKey: SALES_BOT_KEYS.whatsapp, queryFn: getWhatsappConfig })

export const useSaveWhatsappConfig = () => {
    const queryClient = useQueryClient()
    return createMutation({
        mutationFn: (payload: UpdateWhatsappConfigPayload) => updateWhatsappConfig(payload),
        onSuccess: (saved: WhatsappBotConfig) => queryClient.setQueryData(SALES_BOT_KEYS.whatsapp, saved)
    })
}
