import { describe, expect, it } from 'vitest'
import { canRetryReply } from './retry'

describe('canRetryReply', () => {
    const ctx = { isStreaming: false, lastAssistantId: 'a2' }
    const reply = { id: 'a2', role: 'assistant' as const }

    it('respuesta exitosa: NO se reintenta (se copia)', () => {
        expect(canRetryReply(reply, ctx)).toBe(false)
        expect(canRetryReply({ ...reply, is_error: false }, ctx)).toBe(false)
    })

    it('la respuesta o el envío fallaron: se reintenta', () => {
        expect(canRetryReply({ ...reply, is_error: true }, ctx)).toBe(true)
    })

    it('solo la última respuesta y nunca mientras llega otra', () => {
        const failed = { ...reply, is_error: true }
        expect(canRetryReply(failed, { ...ctx, lastAssistantId: 'a9' })).toBe(false)
        expect(canRetryReply(failed, { ...ctx, isStreaming: true })).toBe(false)
        expect(canRetryReply({ id: 'a2', role: 'user', is_error: true }, ctx)).toBe(false)
    })
})
