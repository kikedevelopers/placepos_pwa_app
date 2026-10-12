import { describe, it, expect } from 'vitest'
import { shouldBlockPlaceRoute } from './lib/guard'

describe('shouldBlockPlaceRoute', () => {
    it('bloquea cuando ya cargó y Place está apagado para la cuenta', () => {
        expect(shouldBlockPlaceRoute({ isLoading: false, enabled: false })).toBe(true)
    })

    it('NO bloquea cuando Place está habilitado', () => {
        expect(shouldBlockPlaceRoute({ isLoading: false, enabled: true })).toBe(false)
    })

    it('NO bloquea mientras carga (evita expulsar en falso)', () => {
        expect(shouldBlockPlaceRoute({ isLoading: true, enabled: undefined })).toBe(false)
    })

    it('NO bloquea sin enabled explícito (undefined) aunque no esté cargando', () => {
        expect(shouldBlockPlaceRoute({ isLoading: false, enabled: undefined })).toBe(false)
    })
})
