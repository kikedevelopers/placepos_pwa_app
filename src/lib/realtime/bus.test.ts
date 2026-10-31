import { describe, expect, it, vi } from 'vitest'
import { publishRealtime, subscribeRealtime } from './bus'

describe('bus de tiempo real', () => {
    it('entrega el payload a quien escucha ESE evento', () => {
        const a = vi.fn()
        const b = vi.fn()
        const offA = subscribeRealtime('agent-orders:changed', a)
        const offB = subscribeRealtime('alert:created', b)
        publishRealtime('agent-orders:changed', { reason: 'created' })
        expect(a).toHaveBeenCalledWith({ reason: 'created' })
        expect(b).not.toHaveBeenCalled()
        offA()
        offB()
    })

    it('al desuscribirse deja de recibir', () => {
        const a = vi.fn()
        const off = subscribeRealtime('x', a)
        off()
        publishRealtime('x', 1)
        expect(a).not.toHaveBeenCalled()
    })

    it('un listener que lanza no impide que los demás reciban', () => {
        const broken = vi.fn(() => {
            throw new Error('boom')
        })
        const ok = vi.fn()
        const off1 = subscribeRealtime('y', broken)
        const off2 = subscribeRealtime('y', ok)
        expect(() => publishRealtime('y', 2)).not.toThrow()
        expect(ok).toHaveBeenCalledWith(2)
        off1()
        off2()
    })

    it('sin listeners no pasa nada', () => {
        expect(() => publishRealtime('nadie', null)).not.toThrow()
    })
})
