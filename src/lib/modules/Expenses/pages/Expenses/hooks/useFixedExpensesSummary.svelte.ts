import type { FixedExpense } from '$lib/api/requests/fixedExpenses'
import {
    accruedInPeriodNumber,
    computeAccrual,
    monthlyProjection
} from '$lib/modules/Expenses/utils/accrual'

export interface FixedExpensesSummaryData {
    /** Cantidad de gastos fijos activos. */
    activeCount: number
    /** Acumulado total de los periodos actualmente en curso. */
    accruedToday: number
    /** Costo equivalente proyectado a 30 días sumando todos los gastos. */
    monthlyProjection: number
    /** Fecha del próximo evento (arranque o corte) más cercano. */
    nextPeriodEnd: Date | null
}

/**
 * KPI globales de gastos fijos calculados en cliente con Big.js (vía las utils
 * de accrual). Reactivo: recibe getters de `expenses` y `now` y devuelve un
 * objeto con getter `value` que se recalcula cuando cambia el tick o la lista.
 *
 * Mismo cálculo que placepos: acumulado del periodo, proyección mensual y el
 * próximo evento (si el gasto aún no arranca, el evento es su start_date).
 */
export function useFixedExpensesSummary(
    getExpenses: () => FixedExpense[],
    getNow: () => Date
) {
    const value = $derived.by<FixedExpensesSummaryData>(() => {
        const expenses = getExpenses()
        const now = getNow()

        let accrued = 0
        let monthly = 0
        let nextEnd: Date | null = null

        for (const expense of expenses) {
            accrued += accruedInPeriodNumber(expense, now)
            monthly += monthlyProjection(expense)

            const snapshot = computeAccrual(expense, now)
            const start = new Date(expense.start_date)
            const candidate =
                start.getTime() > now.getTime() ? start : snapshot.currentPeriodEnd
            if (!nextEnd || candidate < nextEnd) {
                nextEnd = candidate
            }
        }

        return {
            activeCount: expenses.length,
            accruedToday: Math.round(accrued * 100) / 100,
            monthlyProjection: Math.round(monthly * 100) / 100,
            nextPeriodEnd: nextEnd
        }
    })

    return {
        get value() {
            return value
        }
    }
}
