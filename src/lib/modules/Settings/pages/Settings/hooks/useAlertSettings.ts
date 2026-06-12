import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query'
import {
    getAlertConfig,
    updateAlertConfig,
    type AlertType,
    type AlertConfigUpdatePayload
} from '$lib/api/requests/alerts'
import { SETTINGS_KEYS } from '../constants/queryKeys'

export const useAlertConfig = (type: AlertType) =>
    createQuery({
        queryKey: SETTINGS_KEYS.alertConfig(type),
        queryFn: () => getAlertConfig(type)
    })

export const useUpdateAlertConfig = (type: AlertType) => {
    const queryClient = useQueryClient()
    return createMutation({
        mutationFn: (payload: AlertConfigUpdatePayload) => updateAlertConfig(type, payload),
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: SETTINGS_KEYS.alertConfig(type) })
    })
}
