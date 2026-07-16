/**
 * Totales de VENTAS del día (base DEVENGADO) para el Cierre del día (Finanzas).
 *
 * Regla de oro (paridad placepos `useMainSummaryTotals` + `MainSummaryTable`):
 * una venta a CRÉDITO es una venta del día por su valor íntegro. El "Total
 * Ventas del Día" = efectivo + consignación + créditos del día + pedidos. El
 * "Recaudo de Cartera" (abonos) es dinero real y va aparte (NO entra aquí).
 *
 * Los KPI del hero (Total Ventas / Ganancia real / Excedente) usan primero los
 * campos DEVENGADOS de `/dashboard/today` (`totalSales`, `salesRealProfit`,
 * `salesSurplus`); si `today` no llegó, hacen fallback al cierre `dc`
 * (`dc.salesProfit` ya incluye la ganancia del crédito).
 */

import type { DailyClosure } from '$lib/api/requests/reports'
import type { TodaySummary } from '$lib/api/requests/dashboard'
import { ordersTotalOfClosure } from './ordersFacturacion'

/**
 * Total Ventas del Día (devengado) calculado desde el cierre:
 * efectivo + consignación + créditos del día + pedidos.
 */
export function dailyClosureSalesTotal(dc: DailyClosure): number {
    return (
        dc.cashSalesTotal +
        dc.consignacionesVentas +
        dc.creditsBreakdown.newCreditsTotal +
        ordersTotalOfClosure(dc)
    )
}

/** Total Ventas del día para el hero: `today.totalSales` con fallback al cierre. */
export function heroTotalSales(dc: DailyClosure, today?: TodaySummary): number {
    return today?.totalSales ?? dailyClosureSalesTotal(dc)
}

/** Ganancia real devengada del día: `today.salesRealProfit` con fallback al cierre. */
export function heroRealProfit(dc: DailyClosure, today?: TodaySummary): number {
    return today?.salesRealProfit ?? dc.salesProfit - dc.expensesTotal
}

/** Excedente (reinversión) devengado: `today.salesSurplus` con fallback al cierre. */
export function heroSurplus(dc: DailyClosure, today?: TodaySummary): number {
    return today?.salesSurplus ?? dailyClosureSalesTotal(dc) - dc.salesProfit
}
