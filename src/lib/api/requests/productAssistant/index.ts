import api from '$lib/api/config'
import type { ApiPayload as ApiResponse } from '$lib/api/requests/dashboard/types'
import type {
    AssistantProfile,
    AssistantProfileSuggestion,
    UpdateAssistantProfilePayload
} from './types'

/** Ficha "Para el asistente" del producto base (solo cloud). */
export const getAssistantProfile = async (productId: number): Promise<AssistantProfile> => {
    const response = await api.get<ApiResponse<AssistantProfile>>(
        `/inventory/${productId}/assistant-profile`
    )
    return response.data.payload
}

export const updateAssistantProfile = async (
    productId: number,
    payload: UpdateAssistantProfilePayload
): Promise<AssistantProfile> => {
    const response = await api.put<ApiResponse<AssistantProfile>>(
        `/inventory/${productId}/assistant-profile`,
        payload
    )
    return response.data.payload
}

/** "Completar con IA": propone la ficha sin guardarla. */
export const suggestAssistantProfile = async (
    productId: number
): Promise<AssistantProfileSuggestion> => {
    const response = await api.post<ApiResponse<AssistantProfileSuggestion>>(
        `/inventory/${productId}/assistant-profile/suggest`
    )
    return response.data.payload
}

export * from './types'
