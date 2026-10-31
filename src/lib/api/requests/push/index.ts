import api from '$lib/api/config'
import type { ApiPayload } from '$lib/api/requests/dashboard/types'

/** Si el servidor envía push y con qué llave pública suscribirse. */
export interface PushPublicKey {
    enabled: boolean
    public_key: string | null
}

/** Suscripción del navegador (`PushSubscription.toJSON()`). */
export interface PushSubscriptionPayload {
    endpoint: string
    keys: { p256dh: string; auth: string }
    user_agent?: string
}

export const getPushPublicKey = async (): Promise<PushPublicKey> => {
    const response = await api.get<PushPublicKey | ApiPayload<PushPublicKey>>('/push/public-key')
    // El controlador puede responder plano o envuelto en `payload` (interceptor).
    const data = response.data as Partial<ApiPayload<PushPublicKey>> & Partial<PushPublicKey>
    const value = (data.payload ?? data) as Partial<PushPublicKey>
    return {
        enabled: value.enabled === true && typeof value.public_key === 'string',
        public_key: typeof value.public_key === 'string' ? value.public_key : null
    }
}

export const savePushSubscription = async (payload: PushSubscriptionPayload): Promise<void> => {
    await api.post('/push/subscriptions', payload)
}

export const removePushSubscription = async (endpoint: string): Promise<void> => {
    await api.delete('/push/subscriptions', { data: { endpoint } })
}
