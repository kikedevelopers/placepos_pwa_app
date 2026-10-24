import { describe, expect, it } from 'vitest'
import { TONE_SOFT, TONE_TEXT, toneForAmount } from './tones'

describe('tones', () => {
    it('todos los tonos tienen texto y fondo suave', () => {
        expect(Object.keys(TONE_TEXT).sort()).toEqual(Object.keys(TONE_SOFT).sort())
    })

    it('toneForAmount: positivo, negativo y cero', () => {
        expect(toneForAmount(10)).toBe('positive')
        expect(toneForAmount(-1)).toBe('negative')
        expect(toneForAmount(0)).toBe('neutral')
        expect(toneForAmount(5, 'brand')).toBe('brand')
    })
})
