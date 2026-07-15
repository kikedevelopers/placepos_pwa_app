import { describe, it, expect } from 'vitest'
import {
    hasOrdersFacturacion,
    hasOrdersTotalOfClosure,
    normalizeOrdersAmount,
    ordersFacturacion,
    ordersTotalOfClosure
} from './ordersFacturacion'

describe('normalizeOrdersAmount', () => {
    it('devuelve el valor cuando es un número > 0', () => {
        expect(normalizeOrdersAmount(44000)).toBe(44000)
        expect(normalizeOrdersAmount(0.5)).toBe(0.5)
    })

    it('devuelve 0 para 0, negativos y no finitos', () => {
        expect(normalizeOrdersAmount(0)).toBe(0)
        expect(normalizeOrdersAmount(-100)).toBe(0)
        expect(normalizeOrdersAmount(Number.NaN)).toBe(0)
        expect(normalizeOrdersAmount(Number.POSITIVE_INFINITY)).toBe(0)
        expect(normalizeOrdersAmount(Number.NEGATIVE_INFINITY)).toBe(0)
    })

    it('devuelve 0 para ausente/null y tipos no numéricos', () => {
        expect(normalizeOrdersAmount(undefined)).toBe(0)
        expect(normalizeOrdersAmount(null)).toBe(0)
        expect(normalizeOrdersAmount('44000')).toBe(0)
        expect(normalizeOrdersAmount({})).toBe(0)
    })
})

describe('ordersFacturacion (resumen extendido — ventas.pedidos)', () => {
    it('devuelve el valor cuando pedidos > 0', () => {
        expect(ordersFacturacion({ pedidos: 44000 })).toBe(44000)
        expect(hasOrdersFacturacion({ pedidos: 44000 })).toBe(true)
    })

    it('devuelve 0 y no muestra la línea cuando pedidos es 0 (flag OFF)', () => {
        expect(ordersFacturacion({ pedidos: 0 })).toBe(0)
        expect(hasOrdersFacturacion({ pedidos: 0 })).toBe(false)
    })

    it('trata ausente/undefined/null como 0 (backend sin el campo)', () => {
        expect(ordersFacturacion({})).toBe(0)
        expect(ordersFacturacion({ pedidos: null })).toBe(0)
        expect(ordersFacturacion(null)).toBe(0)
        expect(ordersFacturacion(undefined)).toBe(0)
        expect(hasOrdersFacturacion({})).toBe(false)
    })

    it('ignora valores negativos o no finitos (defensivo)', () => {
        expect(ordersFacturacion({ pedidos: -100 })).toBe(0)
        expect(ordersFacturacion({ pedidos: Number.NaN })).toBe(0)
        expect(ordersFacturacion({ pedidos: Number.POSITIVE_INFINITY })).toBe(0)
        expect(hasOrdersFacturacion({ pedidos: -100 })).toBe(false)
    })
})

describe('ordersTotalOfClosure (resumen del día — ordersTotal)', () => {
    it('devuelve el valor cuando ordersTotal > 0 (flag ON)', () => {
        expect(ordersTotalOfClosure({ ordersTotal: 17300 })).toBe(17300)
        expect(hasOrdersTotalOfClosure({ ordersTotal: 17300 })).toBe(true)
    })

    it('devuelve 0 y no muestra la línea cuando ordersTotal es 0 (flag OFF)', () => {
        expect(ordersTotalOfClosure({ ordersTotal: 0 })).toBe(0)
        expect(hasOrdersTotalOfClosure({ ordersTotal: 0 })).toBe(false)
    })

    it('trata ausente/undefined/null como 0 (backend antiguo sin el campo)', () => {
        expect(ordersTotalOfClosure({})).toBe(0)
        expect(ordersTotalOfClosure({ ordersTotal: null })).toBe(0)
        expect(ordersTotalOfClosure(null)).toBe(0)
        expect(ordersTotalOfClosure(undefined)).toBe(0)
        expect(hasOrdersTotalOfClosure({})).toBe(false)
    })

    it('ignora valores negativos o no finitos (defensivo)', () => {
        expect(ordersTotalOfClosure({ ordersTotal: -100 })).toBe(0)
        expect(ordersTotalOfClosure({ ordersTotal: Number.NaN })).toBe(0)
        expect(ordersTotalOfClosure({ ordersTotal: Number.POSITIVE_INFINITY })).toBe(0)
        expect(hasOrdersTotalOfClosure({ ordersTotal: -100 })).toBe(false)
    })

    it('no confunde los contratos: ventas.pedidos no alimenta el cierre y viceversa', () => {
        // El cierre usa `ordersTotal`, no `pedidos`.
        expect(ordersTotalOfClosure({ pedidos: 17300 } as { ordersTotal?: number })).toBe(0)
        // El extendido usa `pedidos`, no `ordersTotal`.
        expect(ordersFacturacion({ ordersTotal: 17300 } as { pedidos?: number })).toBe(0)
    })
})
