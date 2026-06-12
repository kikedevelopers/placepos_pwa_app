import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query'
import {
    getTicketSettings,
    updateTicketSetting,
    type UpdateTicketSettingPayload
} from '$lib/api/requests/ticketSettings'
import { SETTINGS_KEYS } from '../constants/queryKeys'

export const useTicketSettings = () =>
    createQuery({ queryKey: SETTINGS_KEYS.ticketSettings, queryFn: getTicketSettings })

export const useUpdateTicketSetting = () => {
    const queryClient = useQueryClient()
    return createMutation({
        mutationFn: ({ id, payload }: { id: number; payload: UpdateTicketSettingPayload }) =>
            updateTicketSetting(id, payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: SETTINGS_KEYS.ticketSettings })
    })
}
