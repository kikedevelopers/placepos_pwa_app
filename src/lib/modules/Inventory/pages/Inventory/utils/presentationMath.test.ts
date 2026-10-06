import { describe, it, expect } from 'vitest'
import { computeCalculatedCost } from './presentationMath'

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
