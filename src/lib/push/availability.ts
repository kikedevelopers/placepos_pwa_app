/**
 * ¿Se pueden activar las notificaciones push en este dispositivo? Lógica pura
 * (sin APIs del navegador) para poder probarla.
 *
 *   - `unsupported`:   el navegador no tiene Push API / service worker.
 *   - `needs-install`: iPhone/iPad en Safari sin instalar: iOS solo permite push
 *                      a la app agregada a la pantalla de inicio (iOS 16.4+).
 *   - `server-off`:    el servidor no tiene llaves VAPID (no envía).
 *   - `denied`:        el usuario las bloqueó (se reactivan en los ajustes del SO).
 *   - `default`:       se pueden pedir.
 *   - `granted`:       ya están activas.
 */
export type PushAvailability =
    | 'unsupported'
    | 'needs-install'
    | 'server-off'
    | 'denied'
    | 'default'
    | 'granted'

export interface PushEnvironment {
    /** `serviceWorker`, `PushManager` y `Notification` existen. */
    supported: boolean
    /** iPhone / iPad (incluye iPadOS que se presenta como Mac con touch). */
    ios: boolean
    /** Abierta como app instalada (display-mode standalone). */
    standalone: boolean
    permission: NotificationPermission | 'unknown'
    /** El servidor envía push (tiene llave pública). `null` = aún no se sabe. */
    serverEnabled: boolean | null
}

export const pushAvailability = (env: PushEnvironment): PushAvailability => {
    // En iOS sin instalar, Safari ni siquiera expone PushManager: la salida es instalar.
    if (env.ios && !env.standalone) return 'needs-install'
    if (!env.supported) return 'unsupported'
    if (env.serverEnabled === false) return 'server-off'
    if (env.permission === 'denied') return 'denied'
    if (env.permission === 'granted') return 'granted'
    return 'default'
}

/**
 * Permiso concedido pero este dispositivo no está suscrito (se desactivó aquí
 * o se perdió la suscripción): se ofrece activar de nuevo, sin volver a pedir
 * permiso al sistema.
 */
export const withSubscription = (
    availability: PushAvailability,
    subscribed: boolean
): PushAvailability => (availability === 'granted' && !subscribed ? 'default' : availability)

/** Detecta iPhone/iPad por el user agent (iPadOS 13+ dice "Macintosh" con touch). */
export const isIosDevice = (userAgent: string, maxTouchPoints = 0): boolean =>
    /iPad|iPhone|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && maxTouchPoints > 1)

/** Llave pública VAPID (base64url) → bytes para `pushManager.subscribe`. */
export const urlBase64ToUint8Array = (base64: string): Uint8Array => {
    const padding = '='.repeat((4 - (base64.length % 4)) % 4)
    const normalized = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
    const raw = atob(normalized)
    const bytes = new Uint8Array(raw.length)
    for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i)
    return bytes
}

/** ¿La suscripción guardada se hizo con OTRA llave (el servidor rotó la VAPID)? */
export const isStaleKey = (current: ArrayBuffer | null, publicKey: string): boolean => {
    if (!current) return false
    const expected = urlBase64ToUint8Array(publicKey)
    const actual = new Uint8Array(current)
    if (actual.length !== expected.length) return true
    return actual.some((byte, index) => byte !== expected[index])
}

/** Textos de cada estado para la tarjeta "Avisos en este dispositivo". */
export const PUSH_COPY: Record<PushAvailability, { title: string; message: string }> = {
    unsupported: {
        title: 'Este navegador no muestra avisos',
        message: 'Abre PlacePOS en Chrome, Edge o Safari actualizado para recibir los pedidos al instante.'
    },
    'needs-install': {
        title: 'Instala la app para recibir avisos',
        message:
            'En iPhone y iPad los avisos llegan a la app instalada: toca Compartir y luego "Agregar a inicio". Ábrela desde ese ícono y actívalos aquí.'
    },
    'server-off': {
        title: 'Avisos no disponibles',
        message: 'El servidor todavía no tiene los avisos push activados.'
    },
    denied: {
        title: 'Los avisos están bloqueados',
        message:
            'Los bloqueaste en este dispositivo. Actívalos en los ajustes de notificaciones del navegador o del teléfono para PlacePOS.'
    },
    default: {
        title: 'Recibe los pedidos al instante',
        message: 'Te avisamos en este dispositivo cuando llegue o cambie un pedido, aunque la app esté cerrada.'
    },
    granted: {
        title: 'Avisos activos en este dispositivo',
        message: 'Te llegan los pedidos del agente aunque la app esté cerrada.'
    }
}
