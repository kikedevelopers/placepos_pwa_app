import { describe, it, expect } from 'vitest'
import { validateSalesBotForm, type SalesBotFormState } from './formLogic'

const form = (overrides: Partial<SalesBotFormState> = {}): SalesBotFormState => ({
    owner_chat_id: '',
    token: '',
    enabled: false,
    ...overrides
})

describe('validateSalesBotForm', () => {
    it('happy path: guarda deshabilitado sin token y sin campos de persona', () => {
        const result = validateSalesBotForm(form(), { hasSavedToken: false })
        expect(result.ok).toBe(true)
        if (result.ok) {
            expect(result.payload).toEqual({ enabled: false, owner_chat_id: '' })
            // Sin token nuevo → no se manda el campo token.
            expect(result.payload.token).toBeUndefined()
            // La persona vive en los ajustes del agente.
            expect(result.payload).not.toHaveProperty('bot_name')
            expect(result.payload).not.toHaveProperty('personality')
        }
    })

    it('activa con token guardado (no reenvía el secreto)', () => {
        const result = validateSalesBotForm(form({ enabled: true }), { hasSavedToken: true })
        expect(result.ok).toBe(true)
        if (result.ok) {
            expect(result.payload.enabled).toBe(true)
            expect(result.payload.token).toBeUndefined()
        }
    })

    it('activa con token nuevo escrito (lo incluye recortado)', () => {
        const result = validateSalesBotForm(form({ enabled: true, token: '  123:ABC  ' }), {
            hasSavedToken: false
        })
        expect(result.ok).toBe(true)
        if (result.ok) {
            expect(result.payload.token).toBe('123:ABC')
            expect(result.payload.enabled).toBe(true)
        }
    })

    it('recorta el owner_chat_id', () => {
        const result = validateSalesBotForm(form({ owner_chat_id: '  999  ' }), {
            hasSavedToken: false
        })
        expect(result.ok && result.payload.owner_chat_id).toBe('999')
    })

    it('no deja ACTIVAR sin token (ni guardado ni nuevo)', () => {
        const result = validateSalesBotForm(form({ enabled: true }), { hasSavedToken: false })
        expect(result.ok).toBe(false)
        if (!result.ok) expect(result.errors.token).toBeTruthy()
    })

    it('un token solo con espacios cuenta como vacío al activar', () => {
        const result = validateSalesBotForm(form({ enabled: true, token: '    ' }), {
            hasSavedToken: false
        })
        expect(result.ok).toBe(false)
        if (!result.ok) expect(result.errors.token).toBeTruthy()
    })
})
