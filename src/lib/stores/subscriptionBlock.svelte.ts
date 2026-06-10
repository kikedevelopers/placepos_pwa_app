/**
 * Estado global de "suscripción vencida". El interceptor de axios lo marca
 * cuando pos_api responde 402 (`SUBSCRIPTION_EXPIRED`); un modal bloqueante en
 * el layout lo consume para tapar la app hasta que el usuario cierre sesión.
 */
class SubscriptionBlockStore {
    expired = $state(false)

    markExpired() {
        this.expired = true
    }

    reset() {
        this.expired = false
    }
}

export const subscriptionBlock = new SubscriptionBlockStore()
