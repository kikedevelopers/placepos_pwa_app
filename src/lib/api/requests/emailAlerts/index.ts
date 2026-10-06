import api from '$lib/api/config'

export const ALERT_TYPE_CREDIT_DUE_TODAY = 'CREDIT_DUE_TODAY' as const
export type EmailAlertType = typeof ALERT_TYPE_CREDIT_DUE_TODAY

export type EmailAlertSettingItem = {
    type: EmailAlertType
    enabled: boolean
}

export type EmailAlertsSettings = {
    /** Correo del owner: a dónde llegan TODAS las alertas por correo. */
    recipientEmail: string | null
    alerts: EmailAlertSettingItem[]
}

export type SetEmailAlertResult = {
    type: EmailAlertType
    enabled: boolean
}

export type SendCreditAlertResult = {
    sent: boolean
    recipientEmail: string | null
    count: number
    totalBalance: number
    date: string
    reason?: 'no-credits' | 'no-owner' | 'mail-disabled' | 'error'
}

type ApiPayload<T> = { success: boolean; payload: T; error?: string }

export const getEmailAlertsSettings = async (): Promise<EmailAlertsSettings> => {
    const response = await api.get<ApiPayload<EmailAlertsSettings>>('/email-alerts/settings')
    return response.data.payload
}

export const setEmailAlert = async (
    type: EmailAlertType,
    enabled: boolean
): Promise<SetEmailAlertResult> => {
    const response = await api.put<ApiPayload<SetEmailAlertResult>>(`/email-alerts/${type}`, {
        enabled
    })
    return response.data.payload
}

/** Envío de prueba (solo dev): dispara la alerta de créditos con datos mock. */
export const testCreditDueTodayAlert = async (): Promise<SendCreditAlertResult> => {
    const response = await api.post<ApiPayload<SendCreditAlertResult>>(
        '/email-alerts/credit-due-today/test'
    )
    return response.data.payload
}
