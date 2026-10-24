import type { AbonoAgeGroup, DailyClosure } from '$lib/api/requests/reports/types'

// Espejo EXACTO de placepos (modules/Reports/DailyClosure/hooks/dailyClosureFallbacks.ts).
// Resiliencia ante versión de backend anterior (típicamente cloud/pos_api aún no
// desplegado): los campos discriminados nuevos pueden llegar `undefined`. Estos
// helpers los derivan de los campos que SIEMPRE existen, para que Finanzas nunca
// se rompa por un backend una versión atrás. Cuando el backend sí los manda, se
// usan tal cual (los `??` no disparan).

export interface DirectSales {
    total: number
    profit: number
    margin: number
}

/**
 * Venta directa (contado) discriminada. Fallback EXACTO cuando el backend no la
 * manda: total = efectivo + consignación + pedidos; ganancia = ganancia total −
 * ganancia del crédito del día; margen = ganancia / total × 100.
 */
export const resolveDirectSales = (data: DailyClosure): DirectSales => {
    const total =
        data.directSalesTotal ??
        data.cashSalesTotal + data.consignacionesVentas + (data.ordersTotal ?? 0)
    const profit =
        data.directSalesProfit ??
        data.salesProfit - data.creditsBreakdown.newCreditsProfit
    const margin =
        data.directSalesMargin ?? (total > 0 ? (profit / total) * 100 : 0)
    return { total, profit, margin }
}

/**
 * Recaudo de cartera discriminado por edad del crédito. Devuelve `null` cuando el
 * backend no lo manda (o llega incompleto): en ese caso la UI degrada a la vista
 * plana de abonos (sin el split por antigüedad) en vez de romperse.
 */
export const resolveAbonosByCreditAge = (
    data: DailyClosure
): { previous: AbonoAgeGroup; today: AbonoAgeGroup } | null => {
    const byAge = data.creditsBreakdown.abonosByCreditAge
    if (!byAge || !byAge.previous || !byAge.today) return null
    return byAge
}
