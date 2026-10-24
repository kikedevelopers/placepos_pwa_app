import { describe, expect, it } from 'vitest'
import { thumbTransform, thumbWidth } from './segmented'

describe('control segmentado', () => {
    it('desplaza el indicador un segmento entero por índice', () => {
        expect(thumbTransform(0, 3)).toBe('translateX(0%)')
        expect(thumbTransform(2, 3)).toBe('translateX(200%)')
    })

    it('acota índices fuera de rango y no enteros', () => {
        expect(thumbTransform(-4, 3)).toBe('translateX(0%)')
        expect(thumbTransform(9, 3)).toBe('translateX(200%)')
        expect(thumbTransform(1.7, 3)).toBe('translateX(100%)')
    })

    it('sin segmentos no rompe', () => {
        expect(thumbTransform(0, 0)).toBe('translateX(0%)')
        expect(thumbWidth(0)).toBe('0px')
    })

    it('el ancho reparte el carril en partes iguales', () => {
        expect(thumbWidth(2)).toBe('calc((100% - 8px) / 2)')
    })
})
