import { describe, it, expect } from 'vitest'
import { buildWhatsappPayload, type WhatsappFormState } from './whatsappFormLogic'

const form = (overrides: Partial<WhatsappFormState> = {}): WhatsappFormState => ({
    owner_chat_id: '',
    enabled: false,
    ...overrides
})

describe('buildWhatsappPayload', () => {
    it('arma el payload sin campos de la Cloud API ni de la persona', () => {
        const payload = buildWhatsappPayload(form({ enabled: true }))
        expect(payload).toEqual({ enabled: true, owner_chat_id: '' })
        expect(payload).not.toHaveProperty('phone_number_id')
        expect(payload).not.toHaveProperty('token')
        expect(payload).not.toHaveProperty('bot_name')
        expect(payload).not.toHaveProperty('personality')
    })

    it('permite ACTIVAR sin credenciales (la conexión es por QR)', () => {
        expect(buildWhatsappPayload(form({ enabled: true })).enabled).toBe(true)
    })

    it('permite desactivar', () => {
        expect(buildWhatsappPayload(form({ enabled: false })).enabled).toBe(false)
    })

    it('deja solo dígitos en el número de avisos', () => {
        expect(
            buildWhatsappPayload(form({ owner_chat_id: '+57 300 123 4567' })).owner_chat_id
        ).toBe('573001234567')
    })

    it('un número de avisos sin dígitos queda vacío (sin avisos)', () => {
        expect(buildWhatsappPayload(form({ owner_chat_id: ' abc ' })).owner_chat_id).toBe('')
    })
})
