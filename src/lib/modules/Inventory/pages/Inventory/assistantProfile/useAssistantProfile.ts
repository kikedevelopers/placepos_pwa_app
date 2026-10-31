import { toStore } from 'svelte/store'
import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query'
import {
    getAssistantProfile,
    suggestAssistantProfile,
    updateAssistantProfile,
    type AssistantProfile,
    type UpdateAssistantProfilePayload
} from '$lib/api/requests/productAssistant'

export const assistantProfileKey = (productId: number) =>
    ['inventory', 'assistant-profile', productId] as const

/** Ficha "Para el asistente" del producto BASE. */
export const useAssistantProfile = (productId: () => number) =>
    createQuery(
        toStore(() => ({
            queryKey: assistantProfileKey(productId()),
            queryFn: () => getAssistantProfile(productId())
        }))
    )

export const useUpdateAssistantProfile = (productId: () => number) => {
    const queryClient = useQueryClient()
    return createMutation({
        mutationFn: (payload: UpdateAssistantProfilePayload) => updateAssistantProfile(productId(), payload),
        onSuccess: (data: AssistantProfile) => queryClient.setQueryData(assistantProfileKey(productId()), data)
    })
}

/** "Completar con IA": propone sin guardar. */
export const useSuggestAssistantProfile = (productId: () => number) =>
    createMutation({ mutationFn: () => suggestAssistantProfile(productId()) })
