import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query'
import {
    getEmailAlertsSettings,
    setEmailAlert,
    testCreditDueTodayAlert,
    type EmailAlertType
} from '$lib/api/requests/emailAlerts'
import { SETTINGS_KEYS } from '../constants/queryKeys'

export const useEmailAlertsSettings = () =>
    createQuery({
        queryKey: SETTINGS_KEYS.emailAlerts,
        queryFn: getEmailAlertsSettings
    })

export const useSetEmailAlert = () => {
    const queryClient = useQueryClient()
    return createMutation({
        mutationFn: ({ type, enabled }: { type: EmailAlertType; enabled: boolean }) =>
            setEmailAlert(type, enabled),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: SETTINGS_KEYS.emailAlerts })
    })
}

/** Envío de prueba (solo dev) de la alerta de créditos con datos mock. */
export const useTestCreditAlert = () =>
    createMutation({
        mutationFn: testCreditDueTodayAlert
    })
