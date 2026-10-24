import Big from 'big.js'
import type { BankDetail, DailyClosure } from '$lib/api/requests/reports/types'
import { resolveAbonosByCreditAge, resolveDirectSales } from './dailyClosureFallbacks'

/**
 * Espejo EXACTO de placepos (DailyClosure/components/MainSummaryTable/
 * buildDayBreakdown.ts): misma fuente para las mismas cifras al centavo.
 *
 * Deriva TODAS las cifras del "Resumen del día" (tabla única) a partir del cierre
 * (`DailyClosure`) más los abonos a compras del día (que viven en otro endpoint,
 * `/dashboard/today`). Función PURA para poder testearla sin render ni red.
 *
 * La tabla mezcla dos naturalezas a propósito, cada una en su bloque:
 *   - DINERO RECOGIDO (caja): efectivo y consignaciones que ENTRARON hoy (venta
 *     de contado + abonos a créditos). Es plata real.
 *   - VENTA DEL DÍA (devengado): lo VENDIDO hoy (contado + crédito), con su
 *     ganancia y margen. El crédito cuenta como venta aunque no se haya cobrado.
 *
 * La ganancia es DEVENGADA (incluye la del crédito del día), y "Ganancia real" =
 * ganancia devengada − gastos VARIABLES. Los abonos a compras y a transportistas
 * son salidas de caja informativas: NO restan de la ganancia (el flete y el costo
 * de la mercancía ya están capitalizados).
 */

/** Suma en dinero con Big.js (evita el arrastre de float), redondeada a 2. */
const add = (...values: number[]): number =>
    Number(values.reduce((acc, v) => acc.plus(new Big(v || 0)), new Big(0)).toFixed(2))

export interface DayBreakdown {
    /** `true` si el backend mandó el recaudo discriminado por edad del crédito. */
    hasAge: boolean

    // ── A. Efectivo recaudado (dinero real) ──────────────────────────────────
    cashSale: number
    cashCollectToday: number
    cashCollectPrevious: number
    /** Abono en efectivo plano (fallback cuando no hay split por edad). */
    cashCollectFlat: number
    totalCashCollected: number

    // ── B. Consignaciones recaudadas (dinero real) ───────────────────────────
    consignSale: number
    consignSaleDetail: BankDetail[]
    consignCollectTodayDetail: BankDetail[]
    consignCollectPreviousDetail: BankDetail[]
    consignCollectFlatDetail: BankDetail[]
    consignCollectToday: number
    consignCollectPrevious: number
    consignCollectFlat: number
    totalConsignCollected: number

    /** Todo el dinero recogido hoy (efectivo + consignaciones). */
    totalCollected: number

    // ── C. Venta del día (devengado, con ganancia/margen) ────────────────────
    saleCash: number
    saleConsign: number
    saleOrders: number
    /**
     * Subtotal de la venta de CONTADO (efectivo + consignación + pedidos), con su
     * ganancia y margen. Es "lo que ya es dinero": la venta SIN los créditos del
     * día. Se muestra antes de la línea de crédito para distinguir cuánto se
     * vendió con dinero que SÍ entró vs. el total con crédito (dinero que aún no).
     */
    directTotal: number
    directProfit: number
    directMargin: number
    saleCredit: number
    saleCreditProfit: number
    saleCreditMargin: number
    hasCredit: boolean
    totalSaleDay: number
    saleProfit: number
    saleMargin: number

    // ── D. Salidas de dinero (informativas) ──────────────────────────────────
    purchasePayments: number
    carrierPayments: number
    variableExpenses: number
    totalOutflows: number

    // ── E. Ganancia real ─────────────────────────────────────────────────────
    grossProfit: number
    /**
     * Ganancia del crédito del día que AÚN NO se ha cobrado (dinero que no está
     * en caja): ganancia devengada del crédito del día − la parte ya cobrada hoy
     * de ese crédito. Se resta para llegar a la ganancia real.
     */
    uncollectedCreditProfit: number
    realProfit: number
}

export const buildDayBreakdown = (
    data: DailyClosure,
    purchasePaymentsTotal = 0
): DayBreakdown => {
    const cb = data.creditsBreakdown
    const byAge = resolveAbonosByCreditAge(data)
    const hasAge = byAge != null

    // A. Efectivo recaudado.
    const cashSale = data.cashSalesTotal
    const cashCollectToday = byAge?.today.cash ?? 0
    const cashCollectPrevious = byAge?.previous.cash ?? 0
    const cashCollectFlat = cb.abonosCash
    const totalCashCollected = add(cashSale, cb.abonosCash)

    // B. Consignaciones recaudadas.
    const consignSale = data.consignacionesVentas
    const consignCollectToday = byAge?.today.consignacion ?? 0
    const consignCollectPrevious = byAge?.previous.consignacion ?? 0
    const consignCollectFlat = cb.abonosConsignacion
    const totalConsignCollected = add(consignSale, cb.abonosConsignacion)

    // C. Venta del día (devengado).
    // Subtotal de contado (venta SIN créditos) con su ganancia/margen. Reusa el
    // fallback que ya deriva la venta directa (o los campos del backend).
    const direct = resolveDirectSales(data)
    const saleCredit = cb.newCreditsTotal
    const totalSaleDay = add(
        data.cashSalesTotal,
        data.consignacionesVentas,
        data.ordersTotal ?? 0,
        saleCredit
    )

    // D. Salidas de dinero.
    const carrierPayments = data.carrierPaymentsTotal ?? 0
    const totalOutflows = add(purchasePaymentsTotal, carrierPayments, data.expensesTotal)

    // E. Ganancia real: a la ganancia devengada de la venta del día le quitamos
    // los gastos variables Y la ganancia del crédito del día que aún NO se cobró
    // (dinero que todavía no está en caja). Así queda la ganancia REALmente
    // cobrada de lo vendido hoy. La parte del crédito ya cobrada hoy es
    // `abonosByCreditAge.today.profit`; si el backend no manda el split, se asume
    // que nada del crédito se cobró (se resta la ganancia íntegra del crédito).
    const todayCollectedCreditProfit = byAge?.today.profit ?? 0
    const uncollectedCreditProfit = Math.max(
        0,
        Number(new Big(cb.newCreditsProfit || 0).minus(todayCollectedCreditProfit).toFixed(2))
    )
    const realProfit = add(data.salesProfit, -data.expensesTotal, -uncollectedCreditProfit)

    return {
        hasAge,

        cashSale,
        cashCollectToday,
        cashCollectPrevious,
        cashCollectFlat,
        totalCashCollected,

        consignSale,
        consignSaleDetail: data.consignacionesDetalle,
        consignCollectTodayDetail: byAge?.today.consignacionDetalle ?? [],
        consignCollectPreviousDetail: byAge?.previous.consignacionDetalle ?? [],
        consignCollectFlatDetail: cb.abonosConsignacionDetalle,
        consignCollectToday,
        consignCollectPrevious,
        consignCollectFlat,
        totalConsignCollected,

        totalCollected: add(totalCashCollected, totalConsignCollected),

        saleCash: data.cashSalesTotal,
        saleConsign: data.consignacionesVentas,
        saleOrders: data.ordersTotal ?? 0,
        directTotal: direct.total,
        directProfit: direct.profit,
        directMargin: direct.margin,
        saleCredit,
        saleCreditProfit: cb.newCreditsProfit,
        saleCreditMargin: cb.newCreditsMargin,
        hasCredit: saleCredit > 0,
        totalSaleDay,
        saleProfit: data.salesProfit,
        saleMargin: data.salesMargin,

        purchasePayments: purchasePaymentsTotal,
        carrierPayments,
        variableExpenses: data.expensesTotal,
        totalOutflows,

        grossProfit: data.salesProfit,
        uncollectedCreditProfit,
        realProfit
    }
}
