import { describe, it, expect } from 'vitest'
import type { DailyClosure } from '$lib/api/requests/reports/types'
import { buildDayBreakdown } from './buildDayBreakdown'

/**
 * Fixture de `DailyClosure` con un día completo:
 *   - Contado: 10.000 efectivo + 4.000 consignación (Nequi 4.000).
 *   - Crédito del día: 6.000 (ganancia 2.000, margen 33.33%).
 *   - Recaudo de cartera: del día 1.000 efectivo; anteriores 3.000 efectivo +
 *     2.000 consignación (Bancolombia).
 *   - salesProfit devengado 5.000 (margen 25% sobre 20.000).
 *   - Gastos variables 1.500.
 */
const build = (over: Partial<DailyClosure> = {}): DailyClosure =>
    ({
        date: '2026-07-22',
        cashSalesTotal: 10000,
        consignacionesVentas: 4000,
        consignacionesDetalle: [{ bankName: 'Nequi', amount: 4000 }],
        ordersTotal: 0,
        salesProfit: 5000,
        salesMargin: 25,
        expensesTotal: 1500,
        carrierPaymentsTotal: 800,
        creditsBreakdown: {
            newCreditsCount: 1,
            newCreditsTotal: 6000,
            newCreditsProfit: 2000,
            newCreditsMargin: 33.33,
            abonosCash: 4000, // 1.000 (hoy) + 3.000 (anteriores)
            abonosConsignacion: 2000, // 2.000 (anteriores, Bancolombia)
            abonosConsignacionDetalle: [{ bankName: 'Bancolombia', amount: 2000 }],
            abonosTotal: 6000,
            abonosByCreditAge: {
                previous: {
                    cash: 3000,
                    consignacion: 2000,
                    consignacionDetalle: [{ bankName: 'Bancolombia', amount: 2000 }],
                    total: 5000,
                    profit: 1000,
                    margin: 20
                },
                today: {
                    cash: 1000,
                    consignacion: 0,
                    consignacionDetalle: [],
                    total: 1000,
                    profit: 300,
                    margin: 30
                }
            },
            pendingBalance: 6000
        },
        ...over
    }) as unknown as DailyClosure

describe('buildDayBreakdown', () => {
    describe('A. Efectivo recaudado (dinero real)', () => {
        it('venta en efectivo + abonos en efectivo del día y anteriores', () => {
            const b = buildDayBreakdown(build())
            expect(b.cashSale).toBe(10000)
            expect(b.cashCollectToday).toBe(1000)
            expect(b.cashCollectPrevious).toBe(3000)
            // Total efectivo recaudado = venta 10.000 + abonos 4.000.
            expect(b.totalCashCollected).toBe(14000)
        })
    })

    describe('B. Consignaciones recaudadas (dinero real)', () => {
        it('venta por consignación (por banco) + abonos por consignación por edad', () => {
            const b = buildDayBreakdown(build())
            expect(b.consignSale).toBe(4000)
            expect(b.consignSaleDetail).toEqual([{ bankName: 'Nequi', amount: 4000 }])
            expect(b.consignCollectPreviousDetail).toEqual([
                { bankName: 'Bancolombia', amount: 2000 }
            ])
            expect(b.consignCollectTodayDetail).toEqual([])
            // Total consignaciones recaudado = venta 4.000 + abonos 2.000.
            expect(b.totalConsignCollected).toBe(6000)
        })
    })

    it('Total recogido en el día = efectivo (14.000) + consignaciones (6.000)', () => {
        const b = buildDayBreakdown(build())
        expect(b.totalCollected).toBe(20000)
    })

    describe('C. Venta del día (devengado)', () => {
        it('efectivo + consignación + crédito, total con ganancia/margen', () => {
            const b = buildDayBreakdown(build())
            expect(b.saleCash).toBe(10000)
            expect(b.saleConsign).toBe(4000)
            expect(b.saleCredit).toBe(6000)
            expect(b.hasCredit).toBe(true)
            expect(b.saleCreditProfit).toBe(2000)
            // Total venta del día = 10.000 + 4.000 + 0 pedidos + 6.000 crédito.
            expect(b.totalSaleDay).toBe(20000)
            expect(b.saleProfit).toBe(5000)
            expect(b.saleMargin).toBe(25)
        })

        it('subtotal de contado (venta SIN créditos) con su ganancia/margen', () => {
            // directSalesTotal/Profit/Margin vienen del backend en el fixture:
            // contado 14.000 (10.000 efectivo + 4.000 consignación), ganancia 3.000.
            const b = buildDayBreakdown(
                build({
                    directSalesTotal: 14000,
                    directSalesProfit: 3000,
                    directSalesMargin: 21.43
                })
            )
            expect(b.directTotal).toBe(14000)
            expect(b.directProfit).toBe(3000)
            expect(b.directMargin).toBe(21.43)
            // Contado (14.000) + crédito (6.000) = total del día (20.000).
            expect(b.directTotal + b.saleCredit).toBe(b.totalSaleDay)
            // Y la ganancia de contado + la del crédito = la ganancia total.
            expect(b.directProfit + b.saleCreditProfit).toBe(b.saleProfit)
        })

        it('deriva el subtotal de contado cuando el backend (viejo) no lo manda', () => {
            // Sin directSales*: total = efectivo+consignación+pedidos = 14.000;
            // ganancia = salesProfit 5.000 − crédito 2.000 = 3.000.
            const b = buildDayBreakdown(build())
            expect(b.directTotal).toBe(14000)
            expect(b.directProfit).toBe(3000)
        })

        it('incluye pedidos cuando ordersTotal > 0', () => {
            const b = buildDayBreakdown(build({ ordersTotal: 2000 }))
            expect(b.saleOrders).toBe(2000)
            expect(b.totalSaleDay).toBe(22000)
        })

        it('sin créditos: hasCredit false y el total no los suma', () => {
            const b = buildDayBreakdown(
                build({
                    creditsBreakdown: {
                        newCreditsCount: 0,
                        newCreditsTotal: 0,
                        newCreditsProfit: 0,
                        newCreditsMargin: 0,
                        abonosCash: 0,
                        abonosConsignacion: 0,
                        abonosConsignacionDetalle: [],
                        abonosTotal: 0,
                        pendingBalance: 0
                    } as DailyClosure['creditsBreakdown']
                })
            )
            expect(b.hasCredit).toBe(false)
            expect(b.totalSaleDay).toBe(14000) // solo contado
        })
    })

    describe('D. Salidas de dinero (informativas)', () => {
        it('abonos a compras + transportistas + gastos variables', () => {
            const b = buildDayBreakdown(build(), 3000)
            expect(b.purchasePayments).toBe(3000)
            expect(b.carrierPayments).toBe(800)
            expect(b.variableExpenses).toBe(1500)
            expect(b.totalOutflows).toBe(5300)
        })

        it('carrierPayments = 0 cuando el backend (viejo) no manda el campo', () => {
            const b = buildDayBreakdown(build({ carrierPaymentsTotal: undefined }))
            expect(b.carrierPayments).toBe(0)
        })
    })

    describe('E. Ganancia real', () => {
        it('ganancia − gastos variables − ganancia del crédito del día sin cobrar', () => {
            // newCreditsProfit 2.000, cobrado hoy de ese crédito (today.profit) 300
            // → ganancia de crédito sin cobrar 1.700.
            const b = buildDayBreakdown(build())
            expect(b.grossProfit).toBe(5000)
            expect(b.uncollectedCreditProfit).toBe(1700)
            // Ganancia real = 5.000 − 1.500 gastos − 1.700 crédito sin cobrar.
            expect(b.realProfit).toBe(1800)
        })

        it('sin créditos: no resta nada por crédito y queda ganancia − gastos', () => {
            const b = buildDayBreakdown(
                build({
                    creditsBreakdown: {
                        newCreditsCount: 0,
                        newCreditsTotal: 0,
                        newCreditsProfit: 0,
                        newCreditsMargin: 0,
                        abonosCash: 0,
                        abonosConsignacion: 0,
                        abonosConsignacionDetalle: [],
                        abonosTotal: 0,
                        pendingBalance: 0
                    } as DailyClosure['creditsBreakdown']
                })
            )
            expect(b.uncollectedCreditProfit).toBe(0)
            expect(b.realProfit).toBe(3500) // 5.000 − 1.500
        })

        it('crédito del día TOTALMENTE cobrado hoy: no resta nada por crédito', () => {
            // today.profit == newCreditsProfit (2.000) → sin cobrar 0.
            const base = build()
            const b = buildDayBreakdown(
                build({
                    creditsBreakdown: {
                        ...base.creditsBreakdown,
                        abonosByCreditAge: {
                            previous: base.creditsBreakdown.abonosByCreditAge!.previous,
                            today: {
                                ...base.creditsBreakdown.abonosByCreditAge!.today,
                                profit: 2000
                            }
                        }
                    } as DailyClosure['creditsBreakdown']
                })
            )
            expect(b.uncollectedCreditProfit).toBe(0)
            expect(b.realProfit).toBe(3500) // 5.000 − 1.500
        })

        it('backend sin split por edad: asume crédito NO cobrado (resta la ganancia íntegra)', () => {
            const b = buildDayBreakdown(
                build({
                    creditsBreakdown: {
                        newCreditsCount: 1,
                        newCreditsTotal: 6000,
                        newCreditsProfit: 2000,
                        newCreditsMargin: 33.33,
                        abonosCash: 0,
                        abonosConsignacion: 0,
                        abonosConsignacionDetalle: [],
                        abonosTotal: 0,
                        pendingBalance: 6000
                        // sin abonosByCreditAge
                    } as DailyClosure['creditsBreakdown']
                })
            )
            expect(b.hasAge).toBe(false)
            expect(b.uncollectedCreditProfit).toBe(2000) // toda la ganancia del crédito
            expect(b.realProfit).toBe(1500) // 5.000 − 1.500 − 2.000
        })

        it('gastos mayores que la ganancia → ganancia real negativa', () => {
            const b = buildDayBreakdown(build({ expensesTotal: 8000 }))
            // 5.000 − 8.000 − 1.700 = −4.700.
            expect(b.realProfit).toBe(-4700)
        })
    })

    describe('redondeo con decimales (productos por gramo)', () => {
        // Los productos vendidos por peso generan costos/valores con decimales.
        // Los totales de la tabla se suman con Big.js y deben cuadrar al centavo,
        // sin arrastre de float (p. ej. 0.1 + 0.2 !== 0.3 en coma flotante).
        it('suma montos con centavos sin arrastre de float', () => {
            const b = buildDayBreakdown(
                build({
                    cashSalesTotal: 1234.57,
                    consignacionesVentas: 0,
                    consignacionesDetalle: [],
                    salesProfit: 456.78,
                    expensesTotal: 12.34,
                    carrierPaymentsTotal: 0.1,
                    creditsBreakdown: {
                        newCreditsCount: 0,
                        newCreditsTotal: 0,
                        newCreditsProfit: 0,
                        newCreditsMargin: 0,
                        abonosCash: 10.1,
                        abonosConsignacion: 0.2,
                        abonosConsignacionDetalle: [{ bankName: 'Nequi', amount: 0.2 }],
                        abonosTotal: 10.3,
                        pendingBalance: 0
                    } as DailyClosure['creditsBreakdown']
                }),
                20.05
            )
            // 1234.57 + 10.1 = 1244.67 exacto (no 1244.6700000001).
            expect(b.totalCashCollected).toBe(1244.67)
            // 0 + 0.2 = 0.2.
            expect(b.totalConsignCollected).toBe(0.2)
            expect(b.totalCollected).toBe(1244.87)
            // Salidas: 20.05 + 0.1 + 12.34 = 32.49.
            expect(b.totalOutflows).toBe(32.49)
            // Ganancia real: 456.78 − 12.34 = 444.44.
            expect(b.realProfit).toBe(444.44)
        })
    })

    describe('fallback: backend sin split por edad', () => {
        it('hasAge false y usa los abonos planos', () => {
            const b = buildDayBreakdown(
                build({
                    creditsBreakdown: {
                        newCreditsCount: 0,
                        newCreditsTotal: 0,
                        newCreditsProfit: 0,
                        newCreditsMargin: 0,
                        abonosCash: 4000,
                        abonosConsignacion: 2000,
                        abonosConsignacionDetalle: [{ bankName: 'Bancolombia', amount: 2000 }],
                        abonosTotal: 6000,
                        pendingBalance: 0
                    } as DailyClosure['creditsBreakdown']
                })
            )
            expect(b.hasAge).toBe(false)
            expect(b.cashCollectFlat).toBe(4000)
            expect(b.consignCollectFlatDetail).toEqual([
                { bankName: 'Bancolombia', amount: 2000 }
            ])
            // Los totales de dinero recogido siguen cuadrando.
            expect(b.totalCashCollected).toBe(14000)
            expect(b.totalConsignCollected).toBe(6000)
        })
    })
})
