import type { CustomerRfm } from '$lib/api/requests/reports/customersRfm'

/**
 * Totales y presentación del informe de Clientes (RFM). "Vencido" = el cliente
 * superó su periodo habitual de compra (no es mora de créditos), igual que en
 * placepos.
 */
export interface RfmTotals {
    count: number
    amount: number
    profit: number
    margin: number
    overdue: number
}

export function rfmTotals(list: readonly CustomerRfm[]): RfmTotals {
    const amount = list.reduce((s, c) => s + c.totalAmount, 0)
    const profit = list.reduce((s, c) => s + c.totalProfit, 0)
    return {
        count: list.length,
        amount,
        profit,
        margin: amount > 0 ? (profit / amount) * 100 : 0,
        overdue: list.filter((c) => c.overdue).length
    }
}

/** Mejores clientes primero (monto desc); opcionalmente solo los vencidos. */
export function sortAndFilterRfm(list: readonly CustomerRfm[], onlyOverdue: boolean): CustomerRfm[] {
    return list.filter((c) => !onlyOverdue || c.overdue).sort((a, b) => b.totalAmount - a.totalAmount)
}

/** "Compró hoy", "Hace 1 día", "Hace 12 días". */
export function recencyLabel(daysSinceLast: number): string {
    if (daysSinceLast <= 0) return 'Compró hoy'
    return `Hace ${daysSinceLast} día${daysSinceLast === 1 ? '' : 's'}`
}
