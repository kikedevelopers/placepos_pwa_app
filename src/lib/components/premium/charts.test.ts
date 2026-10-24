import { describe, expect, it } from 'vitest'
import {
    areaPath,
    barLayout,
    fullHour,
    linePath,
    nearestIndex,
    niceMax,
    seriesPoints,
    shortHour,
    shortMoney
} from './charts'

describe('niceMax', () => {
    it('redondea hacia arriba a 1/2/2,5/5 × 10ⁿ', () => {
        expect(niceMax(1)).toBe(1)
        expect(niceMax(13)).toBe(20)
        expect(niceMax(21)).toBe(25)
        expect(niceMax(119000)).toBe(200000)
        expect(niceMax(480000)).toBe(500000)
        expect(niceMax(510000)).toBe(1000000)
    })

    it('cero, negativos y basura dan 1 (no divide entre cero)', () => {
        expect(niceMax(0)).toBe(1)
        expect(niceMax(-5)).toBe(1)
        expect(niceMax(Number.NaN)).toBe(1)
    })
})

describe('shortMoney', () => {
    it('pesos, miles y millones', () => {
        expect(shortMoney(850)).toBe('$850')
        expect(shortMoney(119400)).toBe('$119k')
        expect(shortMoney(1_250_000)).toBe('$1,3M')
        expect(shortMoney(26_000_000)).toBe('$26M')
    })

    it('negativos y basura', () => {
        expect(shortMoney(-4000)).toBe('−$4k')
        expect(shortMoney(Number.NaN)).toBe('$0')
    })
})

describe('horas', () => {
    it('etiquetas cortas del eje', () => {
        expect([0, 8, 12, 15, 23].map(shortHour)).toEqual(['12a', '8a', '12m', '3p', '11p'])
    })

    it('hora completa del cursor', () => {
        expect(fullHour(0)).toBe('12:00 a. m.')
        expect(fullHour(8)).toBe('8:00 a. m.')
        expect(fullHour(12)).toBe('12:00 p. m.')
        expect(fullHour(15)).toBe('3:00 p. m.')
    })
})

describe('seriesPoints / paths', () => {
    it('reparte la serie a lo ancho y escala al máximo', () => {
        const pts = seriesPoints([0, 50, 100], 200, 100, 100)
        expect(pts).toEqual([
            { x: 0, y: 100 },
            { x: 100, y: 50 },
            { x: 200, y: 0 }
        ])
    })

    it('un solo punto se centra; vacía no tiene puntos', () => {
        expect(seriesPoints([10], 200, 100, 10)).toEqual([{ x: 100, y: 0 }])
        expect(seriesPoints([], 200, 100)).toEqual([])
    })

    it('todo en cero queda sobre la base y los negativos no bajan de ella', () => {
        expect(seriesPoints([0, 0], 100, 80).every((p) => p.y === 80)).toBe(true)
        expect(seriesPoints([-10, 0], 100, 80)[0].y).toBe(80)
    })

    it('trazos de línea y área', () => {
        const pts = [
            { x: 0, y: 10 },
            { x: 50, y: 5 }
        ]
        expect(linePath(pts)).toBe('M0 10 L50 5')
        expect(areaPath(pts, 20)).toBe('M0 10 L50 5 L50 20 L0 20 Z')
        expect(areaPath([], 20)).toBe('')
    })
})

describe('nearestIndex', () => {
    it('elige el punto más cercano y acota los bordes', () => {
        expect(nearestIndex(0, 230, 24)).toBe(0)
        expect(nearestIndex(115, 230, 24)).toBe(12)
        expect(nearestIndex(999, 230, 24)).toBe(23)
        expect(nearestIndex(-20, 230, 24)).toBe(0)
    })

    it('casos degenerados', () => {
        expect(nearestIndex(10, 0, 24)).toBe(0)
        expect(nearestIndex(10, 100, 1)).toBe(0)
    })
})

describe('barLayout', () => {
    it('barras de igual ancho con separación y altura proporcional', () => {
        const bars = barLayout([100, 50, 0], 320, 100, 16)
        expect(bars.map((b) => b.width)).toEqual([96, 96, 96])
        expect(bars[1].x).toBe(112)
        expect(bars[0].height).toBe(100)
        expect(bars[1].height).toBe(50)
        expect(bars[2].height).toBe(0)
    })

    it('sin valores no hay barras', () => {
        expect(barLayout([], 300, 100)).toEqual([])
    })
})
