import { describe, it, expect } from 'vitest'
import type { DailyClosure } from '$lib/api/requests/reports/types'
import { resolveAbonosByCreditAge, resolveDirectSales } from './dailyClosureFallbacks'

// Construye un DailyClosure mínimo con solo lo que leen los fallbacks.
const build = (over: Record<string, unknown> = {}): DailyClosure =>
    ({
        cashSalesTotal: 4000,
        consignacionesVentas: 0,
        ordersTotal: 0,
        salesProfit: 6355.72,
        creditsBreakdown: {
            newCreditsProfit: 3866.68,
            abonosCash: 0,
            abonosConsignacion: 0,
            abonosConsignacionDetalle: [],
            abonosTotal: 0
        },
        ...over
    }) as unknown as DailyClosure

describe('resolveDirectSales', () => {
    it('usa los campos del backend cuando vienen', () => {
        const r = resolveDirectSales(
            build({ directSalesTotal: 4000, directSalesProfit: 2489.04, directSalesMargin: 62.2 })
        )
        expect(r).toEqual({ total: 4000, profit: 2489.04, margin: 62.2 })
    })

    it('deriva EXACTO cuando el backend (viejo) no los manda', () => {
        // total = 4000 + 0 + 0; profit = salesProfit 6355.72 − crédito 3866.68.
        const r = resolveDirectSales(build())
        expect(r.total).toBe(4000)
        expect(r.profit).toBeCloseTo(2489.04, 2)
        expect(r.margin).toBeCloseTo(62.226, 2) // 2489.04 / 4000 * 100
    })

    it('incluye consignación y pedidos en el total derivado', () => {
        const r = resolveDirectSales(
            build({ cashSalesTotal: 1000, consignacionesVentas: 2000, ordersTotal: 1000 })
        )
        expect(r.total).toBe(4000)
    })

    it('total 0 → margen 0 (no divide por cero)', () => {
        const r = resolveDirectSales(
            build({
                cashSalesTotal: 0,
                salesProfit: 0,
                creditsBreakdown: { newCreditsProfit: 0 }
            })
        )
        expect(r.total).toBe(0)
        expect(r.margin).toBe(0)
    })
})

describe('resolveAbonosByCreditAge', () => {
    const group = { cash: 0, consignacion: 0, consignacionDetalle: [], total: 0, profit: 0, margin: 0 }

    it('devuelve el split cuando el backend lo manda', () => {
        const byAge = { previous: group, today: group }
        const r = resolveAbonosByCreditAge(
            build({ creditsBreakdown: { newCreditsProfit: 0, abonosByCreditAge: byAge } })
        )
        expect(r).toBe(byAge)
    })

    it('devuelve null cuando el backend (viejo) no lo manda → vista plana', () => {
        expect(resolveAbonosByCreditAge(build())).toBeNull()
    })

    it('devuelve null si llega incompleto (falta un grupo)', () => {
        const r = resolveAbonosByCreditAge(
            build({
                creditsBreakdown: { newCreditsProfit: 0, abonosByCreditAge: { previous: group } }
            })
        )
        expect(r).toBeNull()
    })
})
