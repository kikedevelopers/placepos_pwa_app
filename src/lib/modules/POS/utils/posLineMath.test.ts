import { describe, expect, it } from 'vitest'
import {
    buildConfiguredLine,
    calculateMarginFromPrices,
    calculateProfit,
    lineProfit,
    lineTotal,
    quantityFromAmount,
    roundToDecimals
} from './posLineMath'

describe('posLineMath · helpers básicos', () => {
    it('roundToDecimals redondea y tolera nulos/NaN', () => {
        expect(roundToDecimals(2000.0012, 2)).toBe(2000)
        expect(roundToDecimals(1999.95, 2)).toBe(1999.95)
        expect(roundToDecimals(null, 2)).toBe(0)
        expect(roundToDecimals(NaN, 2)).toBe(0)
    })

    it('calculateProfit = precio − costo (2 decimales)', () => {
        expect(calculateProfit(5200, 4400)).toBe(800)
        expect(calculateProfit(100, 100)).toBe(0)
        expect(calculateProfit(50, 80)).toBe(-30)
    })

    it('calculateMarginFromPrices = ((precio−costo)/precio)·100 (4 decimales)', () => {
        expect(calculateMarginFromPrices(5200, 4400)).toBe(15.3846)
        expect(calculateMarginFromPrices(100, 100)).toBe(0)
        // precio <= 0 → 0 (indefinido)
        expect(calculateMarginFromPrices(0, 10)).toBe(0)
    })

    it('quantityFromAmount = monto/precio exacto; 0 ante entradas inválidas', () => {
        expect(quantityFromAmount(2000, 83)).toBeCloseTo(24.096385542, 6)
        expect(quantityFromAmount(0, 83)).toBe(0)
        expect(quantityFromAmount(2000, 0)).toBe(0)
        expect(quantityFromAmount(-5, 83)).toBe(0)
    })

    it('lineTotal reconstruye el monto a escala de dinero', () => {
        expect(lineTotal(83, 24.0964)).toBe(2000)
        expect(lineTotal(1500, 1.3333)).toBe(1999.95)
        expect(lineTotal(5200, 2)).toBe(10400)
    })

    it('lineProfit = ganancia_unitaria × cantidad (2 decimales)', () => {
        expect(lineProfit(83, 50, 24.0964)).toBe(795.18)
        expect(lineProfit(5200, 4400, 2)).toBe(1600)
    })
})

describe('posLineMath · buildConfiguredLine', () => {
    it('modo normal (precio de lista): total = precio × cantidad', () => {
        const line = buildConfiguredLine({
            price: 5200,
            cost: 4400,
            quantity: 2,
            manualPrice: 0,
            isAutoCalcMode: false
        })
        expect(line.isManual).toBe(false)
        expect(line.quantity).toBe(2)
        expect(line.price).toBe(5200)
        expect(line.total).toBe(10400)
        expect(line.profit).toBe(1600)
        expect(line.margin).toBe(15.3846)
    })

    it('precio manual (sin cálculo por monto): isManual y total = manual × cantidad', () => {
        const line = buildConfiguredLine({
            price: 6000,
            cost: 4400,
            quantity: 3,
            manualPrice: 6000,
            isAutoCalcMode: false
        })
        expect(line.isManual).toBe(true)
        expect(line.quantity).toBe(3)
        expect(line.total).toBe(18000)
        expect(line.profit).toBe(4800)
    })

    it('cálculo por monto: cantidad re-derivada a 4 decimales y TOTAL pinado al monto', () => {
        const line = buildConfiguredLine({
            price: 83,
            cost: 50,
            quantity: 1,
            manualPrice: 2000,
            isAutoCalcMode: true
        })
        expect(line.isManual).toBe(true)
        expect(line.quantity).toBe(24.0964)
        // El total es EXACTAMENTE el monto digitado, no 83 × 24,0964.
        expect(line.total).toBe(2000)
        expect(line.profit).toBe(795.18)
    })

    it('cálculo por monto con precio alto: el pin evita el drift (2.000, no 1.999,95)', () => {
        const line = buildConfiguredLine({
            price: 1500,
            cost: 1000,
            quantity: 1,
            manualPrice: 2000,
            isAutoCalcMode: true
        })
        expect(line.quantity).toBe(1.3333)
        expect(line.total).toBe(2000)
        // Sin el pin sería lineTotal(1500, 1.3333) = 1999.95
        expect(lineTotal(1500, 1.3333)).toBe(1999.95)
    })

    it('cálculo por monto activado pero sin monto (>0): cae a modo normal', () => {
        const line = buildConfiguredLine({
            price: 5200,
            cost: 4400,
            quantity: 2,
            manualPrice: 0,
            isAutoCalcMode: true
        })
        // isManual sigue true (auto-calc), pero el total es precio × cantidad.
        expect(line.isManual).toBe(true)
        expect(line.quantity).toBe(2)
        expect(line.total).toBe(10400)
    })
})
