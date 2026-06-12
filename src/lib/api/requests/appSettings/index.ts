import api from '$lib/api/config'
import type { ApiPayload } from '$lib/api/requests/dashboard/types'

/** Configuración de validación de márgenes del POS. */
export type PosMarginsConfig = {
    enabled: boolean
    margins: number[]
}

/** Control estricto de stock. */
export type StrictInventoryConfig = {
    enabled: boolean
}

export const getPosMargins = async (): Promise<PosMarginsConfig> => {
    const response = await api.get<ApiPayload<PosMarginsConfig>>('/app-settings/pos-margins')
    return response.data.payload
}

export const updatePosMargins = async (
    payload: PosMarginsConfig
): Promise<PosMarginsConfig> => {
    const response = await api.put<ApiPayload<PosMarginsConfig>>('/app-settings/pos-margins', payload)
    return response.data.payload
}

export const getStrictInventory = async (): Promise<StrictInventoryConfig> => {
    const response = await api.get<ApiPayload<StrictInventoryConfig>>(
        '/app-settings/strict-inventory'
    )
    return response.data.payload
}

/** PUT restringido a owner|superadmin en pos_api (403 para manager). */
export const updateStrictInventory = async (
    payload: StrictInventoryConfig
): Promise<StrictInventoryConfig> => {
    const response = await api.put<ApiPayload<StrictInventoryConfig>>(
        '/app-settings/strict-inventory',
        payload
    )
    return response.data.payload
}
