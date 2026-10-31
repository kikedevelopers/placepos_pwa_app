import { browser } from '$app/environment'
import {
    getPushPublicKey,
    removePushSubscription,
    savePushSubscription
} from '$lib/api/requests/push'
import {
    isIosDevice,
    isStaleKey,
    pushAvailability,
    urlBase64ToUint8Array,
    withSubscription,
    type PushAvailability,
    type PushEnvironment
} from './availability'

/** Cuánto esperar al service worker (en desarrollo no se registra). */
const SW_TIMEOUT_MS = 4000

const isStandalone = (): boolean =>
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true

const environment = (serverEnabled: boolean | null): PushEnvironment => ({
    supported: 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window,
    ios: isIosDevice(navigator.userAgent, navigator.maxTouchPoints ?? 0),
    standalone: isStandalone(),
    permission: 'Notification' in window ? Notification.permission : 'unknown',
    serverEnabled
})

/** El registro del service worker, o `null` si no hay (desarrollo) o tarda demasiado. */
const registration = async (): Promise<ServiceWorkerRegistration | null> => {
    const found = await navigator.serviceWorker.getRegistration('/')
    if (found?.active) return found
    return Promise.race([
        navigator.serviceWorker.ready,
        new Promise<null>((resolve) => setTimeout(() => resolve(null), SW_TIMEOUT_MS))
    ])
}

/**
 * Notificaciones push de ESTE dispositivo. Pide permiso, suscribe el navegador
 * con la llave VAPID del servidor y guarda la suscripción en pos_api (que
 * decide qué avisos le tocan). `sync()` re-registra la suscripción al iniciar
 * sesión o cambiar de negocio, para que el servidor sepa dónde está el usuario.
 */
class PushStore {
    availability = $state<PushAvailability>('unsupported')
    busy = $state(false)
    error = $state<string | null>(null)
    private publicKey: string | null = null
    private serverEnabled: boolean | null = null

    /** Relee el estado (llave del servidor + permiso del navegador). */
    async refresh(): Promise<void> {
        if (!browser) return
        if (this.serverEnabled === null) {
            try {
                const key = await getPushPublicKey()
                this.serverEnabled = key.enabled
                this.publicKey = key.public_key
            } catch {
                // Sin respuesta: se deja pedir; el envío dirá si falla.
            }
        }
        const base = pushAvailability(environment(this.serverEnabled))
        this.availability = withSubscription(base, base === 'granted' && (await this.isSubscribed()))
    }

    /** ¿Este dispositivo tiene una suscripción viva? (sin esperar al SW). */
    private async isSubscribed(): Promise<boolean> {
        try {
            const reg = await navigator.serviceWorker.getRegistration('/')
            return Boolean(await reg?.pushManager.getSubscription())
        } catch {
            return false
        }
    }

    /**
     * Activa los avisos. Debe llamarse desde un toque del usuario: iOS solo
     * muestra el permiso dentro de ese gesto, por eso se pide ANTES de cualquier
     * otra espera.
     */
    async enable(): Promise<boolean> {
        if (!browser || this.busy) return false
        this.busy = true
        this.error = null
        try {
            const permission = await Notification.requestPermission()
            if (permission !== 'granted') {
                await this.refresh()
                return false
            }
            await this.refresh()
            const saved = await this.subscribeAndSave()
            if (!saved) {
                this.error = 'No se pudo activar en este dispositivo. Abre la app instalada e inténtalo de nuevo.'
            }
            return saved
        } catch {
            this.error = 'No se pudo activar los avisos. Inténtalo de nuevo.'
            return false
        } finally {
            this.busy = false
            await this.refresh()
        }
    }

    /** Desactiva los avisos en este dispositivo (navegador y servidor). */
    async disable(): Promise<void> {
        if (!browser || this.busy) return
        this.busy = true
        this.error = null
        try {
            const reg = await registration()
            const subscription = await reg?.pushManager.getSubscription()
            if (subscription) {
                await removePushSubscription(subscription.endpoint).catch(() => undefined)
                await subscription.unsubscribe()
            }
        } finally {
            this.busy = false
        }
    }

    /**
     * Con el permiso ya concedido, asegura que el servidor tenga la suscripción
     * de este dispositivo con el usuario y negocio actuales. Silencioso.
     */
    async sync(): Promise<void> {
        if (!browser) return
        await this.refresh()
        if (this.availability !== 'granted') return
        await this.subscribeAndSave().catch(() => false)
    }

    /** Al cerrar sesión: este dispositivo deja de recibir los avisos de esa cuenta. */
    async detach(): Promise<void> {
        if (!browser || !('serviceWorker' in navigator)) return
        try {
            const reg = await registration()
            const subscription = await reg?.pushManager.getSubscription()
            if (subscription) await removePushSubscription(subscription.endpoint)
        } catch {
            // Sin red: el servidor la limpiará cuando el envío falle o la reasigne.
        }
    }

    private async subscribeAndSave(): Promise<boolean> {
        if (!this.publicKey) return false
        const reg = await registration()
        if (!reg) return false
        let subscription = await reg.pushManager.getSubscription()
        if (subscription && isStaleKey(subscription.options.applicationServerKey, this.publicKey)) {
            await subscription.unsubscribe()
            subscription = null
        }
        subscription ??= await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(this.publicKey) as BufferSource
        })
        const json = subscription.toJSON()
        if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return false
        await savePushSubscription({
            endpoint: json.endpoint,
            keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
            user_agent: navigator.userAgent.slice(0, 300)
        })
        return true
    }
}

export const pushStore = new PushStore()
