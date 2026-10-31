import { describe, expect, it } from 'vitest'
import {
    isIosDevice,
    isStaleKey,
    pushAvailability,
    urlBase64ToUint8Array,
    withSubscription,
    type PushEnvironment
} from './availability'

const env = (patch: Partial<PushEnvironment> = {}): PushEnvironment => ({
    supported: true,
    ios: false,
    standalone: false,
    permission: 'default',
    serverEnabled: true,
    ...patch
})

describe('pushAvailability', () => {
    it('Android/escritorio con todo listo: se pueden pedir', () => {
        expect(pushAvailability(env())).toBe('default')
    })

    it('ya concedidas / bloqueadas', () => {
        expect(pushAvailability(env({ permission: 'granted' }))).toBe('granted')
        expect(pushAvailability(env({ permission: 'denied' }))).toBe('denied')
    })

    it('iPhone en Safari sin instalar: hay que instalarla (aunque no exponga Push API)', () => {
        expect(pushAvailability(env({ ios: true, supported: false }))).toBe('needs-install')
        expect(pushAvailability(env({ ios: true, standalone: true }))).toBe('default')
    })

    it('navegador sin Push API', () => {
        expect(pushAvailability(env({ supported: false }))).toBe('unsupported')
    })

    it('servidor sin llaves: no se ofrece; mientras no se sabe, se deja pedir', () => {
        expect(pushAvailability(env({ serverEnabled: false }))).toBe('server-off')
        expect(pushAvailability(env({ serverEnabled: null }))).toBe('default')
    })

    it('el servidor apagado pesa más que el permiso concedido', () => {
        expect(pushAvailability(env({ serverEnabled: false, permission: 'granted' }))).toBe(
            'server-off'
        )
    })
})

describe('isIosDevice', () => {
    it('iPhone, iPad y iPadOS que se presenta como Mac con touch', () => {
        expect(isIosDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)')).toBe(true)
        expect(isIosDevice('Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)')).toBe(true)
        expect(isIosDevice('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 5)).toBe(true)
    })

    it('Mac de escritorio y Android no', () => {
        expect(isIosDevice('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 0)).toBe(false)
        expect(isIosDevice('Mozilla/5.0 (Linux; Android 14; Pixel 8)')).toBe(false)
    })
})

describe('urlBase64ToUint8Array / isStaleKey', () => {
    // "hola" en base64url sin relleno.
    it('decodifica base64url sin relleno', () => {
        expect([...urlBase64ToUint8Array('aG9sYQ')]).toEqual([104, 111, 108, 97])
        expect([...urlBase64ToUint8Array('-_8')]).toEqual([251, 255])
    })

    it('detecta una suscripción hecha con otra llave', () => {
        const same = urlBase64ToUint8Array('aG9sYQ').buffer as ArrayBuffer
        expect(isStaleKey(same, 'aG9sYQ')).toBe(false)
        expect(isStaleKey(same, 'Y2hhbw')).toBe(true)
        expect(isStaleKey(urlBase64ToUint8Array('aG9s').buffer as ArrayBuffer, 'aG9sYQ')).toBe(true)
        expect(isStaleKey(null, 'aG9sYQ')).toBe(false)
    })
})

describe('withSubscription', () => {
    it('permiso concedido sin suscripción: se ofrece activar de nuevo', () => {
        expect(withSubscription('granted', false)).toBe('default')
        expect(withSubscription('granted', true)).toBe('granted')
    })

    it('los demás estados no cambian', () => {
        for (const state of ['default', 'denied', 'needs-install', 'unsupported', 'server-off'] as const) {
            expect(withSubscription(state, false)).toBe(state)
        }
    })
})
