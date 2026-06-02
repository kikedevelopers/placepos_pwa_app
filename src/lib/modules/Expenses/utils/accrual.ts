import Big from 'big.js'
import type { FixedExpense, FixedExpensePeriodUnit } from '$lib/api/requests/fixedExpenses'
import { PERIOD_UNIT_META } from '../constants/periodicity'

const MS_PER_HOUR = 3_600_000

const totalPeriodHours = (quantity: number, unit: FixedExpensePeriodUnit): number =>
    quantity * PERIOD_UNIT_META[unit].hoursPerUnit

/** Tasa generada por una hora del periodo (monto / horas_totales_del_periodo). */
export const ratePerHour = (expense: FixedExpense): Big => {
    const hours = totalPeriodHours(expense.period_quantity, expense.period_unit)
    if (hours <= 0) return new Big(0)
    return new Big(expense.amount).div(hours)
}

/** Tasa por día (24 × tasa horaria). */
export const ratePerDay = (expense: FixedExpense): Big => ratePerHour(expense).times(24)

/** Tasa proyectada a 30 días (la unidad "mensual" del producto). */
export const ratePerMonth = (expense: FixedExpense): Big => ratePerHour(expense).times(24 * 30)

interface AccrualSnapshot {
    /** Monto acumulado total desde start_date hasta now. */
    accruedTotal: Big
    /** Monto acumulado dentro del periodo actual. */
    accruedInCurrentPeriod: Big
    /** Cuántos periodos completos han transcurrido. */
    completedPeriods: number
    /** Progreso [0, 1) del periodo actual. */
    currentPeriodProgress: number
    /** Hora ISO en la que arranca el periodo actual. */
    currentPeriodStart: Date
    /** Hora ISO en la que termina el periodo actual. */
    currentPeriodEnd: Date
}

/**
 * Calcula el estado de acumulación de un gasto fijo en el instante `now`.
 * Si `now < start_date` todo queda en cero — el gasto aún no empezó a correr.
 */
export const computeAccrual = (expense: FixedExpense, now: Date = new Date()): AccrualSnapshot => {
    const start = new Date(expense.start_date)
    const periodHours = totalPeriodHours(expense.period_quantity, expense.period_unit)
    const elapsedMs = now.getTime() - start.getTime()
    const elapsedHours = elapsedMs / MS_PER_HOUR

    if (elapsedHours <= 0 || periodHours <= 0) {
        return {
            accruedTotal: new Big(0),
            accruedInCurrentPeriod: new Big(0),
            completedPeriods: 0,
            currentPeriodProgress: 0,
            currentPeriodStart: start,
            currentPeriodEnd: new Date(start.getTime() + periodHours * MS_PER_HOUR)
        }
    }

    const completedPeriods = Math.floor(elapsedHours / periodHours)
    const hoursIntoCurrentPeriod = elapsedHours - completedPeriods * periodHours
    const currentProgress = hoursIntoCurrentPeriod / periodHours

    const rate = ratePerHour(expense)
    const accruedTotal = rate.times(elapsedHours)
    const accruedInCurrentPeriod = rate.times(hoursIntoCurrentPeriod)

    const currentPeriodStart = new Date(
        start.getTime() + completedPeriods * periodHours * MS_PER_HOUR
    )
    const currentPeriodEnd = new Date(
        currentPeriodStart.getTime() + periodHours * MS_PER_HOUR
    )

    return {
        accruedTotal,
        accruedInCurrentPeriod,
        completedPeriods,
        currentPeriodProgress: currentProgress,
        currentPeriodStart,
        currentPeriodEnd
    }
}

/** Acumulado total como número (para sumar fácilmente en KPIs). */
export const accruedTotalNumber = (expense: FixedExpense, now: Date = new Date()): number =>
    Number(computeAccrual(expense, now).accruedTotal.toFixed(2))

/** Proyección mensual del gasto (monto que pesa el gasto fijo cada 30 días). */
export const monthlyProjection = (expense: FixedExpense): number =>
    Number(ratePerMonth(expense).toFixed(2))

/** Acumulado del periodo actual como número. */
export const accruedInPeriodNumber = (
    expense: FixedExpense,
    now: Date = new Date()
): number => Number(computeAccrual(expense, now).accruedInCurrentPeriod.toFixed(2))
