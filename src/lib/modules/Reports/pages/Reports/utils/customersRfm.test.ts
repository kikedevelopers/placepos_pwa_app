import { describe, expect, it } from 'vitest'
import type { CustomerRfm } from '$lib/api/requests/reports/customersRfm'
import { recencyLabel, rfmTotals, sortAndFilterRfm } from './customersRfm'

const c = (id: number, amount: number, profit: number, overdue = false): CustomerRfm => ({
    customerId: id,
    customerName: `C${id}`,
    phone: null,
    docNumber: null,
    purchaseDates: 1,
    ticketCount: 1,
    lastPurchaseDate: '2026-10-20',
    daysSinceLast: 4,
    avgPeriodDays: 7,
    overdue,
    totalAmount: amount,
    totalCost: amount - profit,
    totalProfit: profit,
    totalMargin: amount > 0 ? (profit / amount) * 100 : 0,
    dailyBreakdown: []
})

describe('rfmTotals', () => {
    it('suma montos y ganancias y recalcula el margen', () => {
        const t = rfmTotals([c(1, 1000, 200), c(2, 3000, 600, true)])
        expect(t).toEqual({ count: 2, amount: 4000, profit: 800, margin: 20, overdue: 1 })
    })

    it('lista vacía sin dividir entre cero', () => {
        expect(rfmTotals([])).toEqual({ count: 0, amount: 0, profit: 0, margin: 0, overdue: 0 })
    })
})

describe('sortAndFilterRfm', () => {
    const list = [c(1, 100, 10), c(2, 900, 90, true), c(3, 500, 50, true)]

    it('ordena por monto descendente sin mutar la entrada', () => {
        expect(sortAndFilterRfm(list, false).map((x) => x.customerId)).toEqual([2, 3, 1])
        expect(list.map((x) => x.customerId)).toEqual([1, 2, 3])
    })

    it('solo vencidos', () => {
        expect(sortAndFilterRfm(list, true).map((x) => x.customerId)).toEqual([2, 3])
    })
})

describe('recencyLabel', () => {
    it('hoy, singular y plural', () => {
        expect(recencyLabel(0)).toBe('Compró hoy')
        expect(recencyLabel(-1)).toBe('Compró hoy')
        expect(recencyLabel(1)).toBe('Hace 1 día')
        expect(recencyLabel(12)).toBe('Hace 12 días')
    })
})
