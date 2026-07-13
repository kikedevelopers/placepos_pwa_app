import { describe, it, expect } from 'vitest'
import { computeCalculatedCost, computeFromPriceValue } from './presentationMath'

describe('computeCalculatedCost', () => {
    it('costo = (costo padre / value padre) × effectiveValue', () => {
        // Base "MIELTERTOS X 25 UN": costo 44000, empaque 25. Presentación "SOBRE"
        // (1 unidad base) → costo 44000/25 × 1 = 1760.
        expect(computeCalculatedCost(44000, 25, 1)).toBe(1760)
    })

    it('escala con effectiveValue', () => {
        expect(computeCalculatedCost(1000, 25, 5)).toBe(200)
        expect(computeCalculatedCost(44000, 25, 3)).toBe(5280)
    })

    it('redondea a 2 decimales (halfUp)', () => {
        // 100/3 × 1 = 33.333... → 33.33
        expect(computeCalculatedCost(100, 3, 1)).toBe(33.33)
    })

    it('devuelve 0 si el value del padre o el effectiveValue no son válidos', () => {
        expect(computeCalculatedCost(1000, 0, 5)).toBe(0)
        expect(computeCalculatedCost(1000, 25, 0)).toBe(0)
        expect(computeCalculatedCost(1000, -1, 5)).toBe(0)
    })
})

describe('computeFromPriceValue', () => {
    it('cantidad = precioMaxPres × valuePadre / precioMaxPadre', () => {
        // 2500 × 25 / 44000 = 1.4204… → 1.42
        expect(computeFromPriceValue(2500, 25, 44000)).toBe(1.42)
    })

    it('proporcional (media unidad)', () => {
        // 500 × 10 / 1000 = 5
        expect(computeFromPriceValue(500, 10, 1000)).toBe(5)
    })

    it('devuelve 0 si no hay precio de padre', () => {
        expect(computeFromPriceValue(2500, 25, 0)).toBe(0)
    })
})
