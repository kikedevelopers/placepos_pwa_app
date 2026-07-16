import { describe, it, expect } from 'vitest'
import type { DailyClosure } from '$lib/api/requests/reports'
import type { TodaySummary } from '$lib/api/requests/dashboard'
import {
    dailyClosureSalesTotal,
    heroRealProfit,
    heroSurplus,
    heroTotalSales
} from './ventasDevengado'

const makeClosure = (overrides: Partial<DailyClosure> = {}): DailyClosure => ({
    date: '2026-07-16',
    cashSalesTotal: 100000,
    salesBreakdown: { grossSales: 0, creditNotes: 0, debitNotes: 0, netSales: 0 },
    consignacionesVentas: 50000,
    consignacionesDetalle: [],
    ordersTotal: 0,
    creditsBreakdown: {
        newCreditsCount: 1,
        newCreditsTotal: 70000,
        newCreditsProfit: 7160,
        newCreditsMargin: 10.23,
        abonosCash: 0,
        abonosConsignacion: 0,
        abonosConsignacionDetalle: [],
        abonosTotal: 0,
        pendingBalance: 70000
    },
    expensesTotal: 20000,
    finalTotal: 150000,
    profit: 15000,
    margin: 10,
    salesProfit: 22160,
    salesMargin: 10.07,
    creditsProfit: 0,
    creditsMargin: 0,
    totalPendingCredits: { count: 1, totalAmount: 70000, paidAmount: 0, balance: 70000 },
    adjustmentNotes: [],
    adjustmentNotesSummary: { count: 0, totalCredit: 0, totalDebit: 0 },
    ...overrides
})

const makeToday = (overrides: Partial<TodaySummary> = {}): TodaySummary =>
    ({
        totalSales: 220000,
        salesProfit: 22160,
        salesSurplus: 197840,
        salesRealProfit: 2160,
        ...overrides
    }) as TodaySummary

describe('dailyClosureSalesTotal (DEVENGADO)', () => {
    it('suma efectivo + consignación + créditos del día + pedidos', () => {
        // 100000 + 50000 + 70000 + 0
        expect(dailyClosureSalesTotal(makeClosure())).toBe(220000)
    })

    it('incluye la facturación de pedidos cuando el flag está ON', () => {
        // 100000 + 50000 + 70000 + 44000
        expect(dailyClosureSalesTotal(makeClosure({ ordersTotal: 44000 }))).toBe(264000)
    })

    it('sin créditos del día = solo contado + pedidos', () => {
        const dc = makeClosure({
            creditsBreakdown: {
                ...makeClosure().creditsBreakdown,
                newCreditsCount: 0,
                newCreditsTotal: 0,
                newCreditsProfit: 0,
                newCreditsMargin: 0
            }
        })
        expect(dailyClosureSalesTotal(dc)).toBe(150000)
    })

    it('trata ordersTotal ausente/negativo como 0 (defensivo, vía ordersFacturacion)', () => {
        const sinOrders = makeClosure({ ordersTotal: undefined })
        expect(dailyClosureSalesTotal(sinOrders)).toBe(220000)
        const negativo = makeClosure({ ordersTotal: -100 })
        expect(dailyClosureSalesTotal(negativo)).toBe(220000)
    })

    it('NO suma los abonos (Recaudo de Cartera va aparte)', () => {
        const conAbonos = makeClosure({
            creditsBreakdown: { ...makeClosure().creditsBreakdown, abonosCash: 30000, abonosTotal: 30000 }
        })
        expect(dailyClosureSalesTotal(conAbonos)).toBe(220000)
    })
})

describe('heroTotalSales', () => {
    it('prefiere today.totalSales cuando está disponible', () => {
        const today = makeToday({ totalSales: 999999 })
        expect(heroTotalSales(makeClosure(), today)).toBe(999999)
    })

    it('cae al cálculo del cierre cuando today no llegó', () => {
        expect(heroTotalSales(makeClosure(), undefined)).toBe(220000)
    })
})

describe('heroRealProfit', () => {
    it('prefiere today.salesRealProfit', () => {
        const today = makeToday({ salesRealProfit: 12345 })
        expect(heroRealProfit(makeClosure(), today)).toBe(12345)
    })

    it('fallback = salesProfit − gastos (DEVENGADO, no caja)', () => {
        // 22160 − 20000
        expect(heroRealProfit(makeClosure(), undefined)).toBe(2160)
    })
})

describe('heroSurplus', () => {
    it('prefiere today.salesSurplus', () => {
        const today = makeToday({ salesSurplus: 54321 })
        expect(heroSurplus(makeClosure(), today)).toBe(54321)
    })

    it('fallback = total ventas del día − salesProfit', () => {
        // 220000 − 22160
        expect(heroSurplus(makeClosure(), undefined)).toBe(197840)
    })
})
