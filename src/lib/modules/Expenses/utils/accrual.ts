// Espejo EXACTO de placepos (FixedExpenses/utils/accrual.ts): intervalo fijo
// (legacy) + convenciones de calendario (Quincenal / Mensual).
import Big from 'big.js'
import type { FixedExpense, FixedExpensePeriodUnit } from '$lib/api/requests/fixedExpenses'
import { hoursPerUnitOf } from '../constants/periodicity'
import { computeCalendarSchedule, isCalendarUnit } from './periodSchedule'

const MS_PER_HOUR = 3_600_000
const HOURS_PER_DAY = 24

const totalPeriodHours = (quantity: number, unit: FixedExpensePeriodUnit): number =>
    quantity * hoursPerUnitOf(unit)

interface AccrualSnapshot {
    /** Monto acumulado total desde start_date hasta now. */
    accruedTotal: Big
    /** Monto acumulado dentro del periodo actual. */
    accruedInCurrentPeriod: Big
    /** Cuántos periodos completos han transcurrido. */
    completedPeriods: number
    /** Progreso [0, 1) del periodo actual. */
    currentPeriodProgress: number
    /** Hora en la que arranca el periodo actual. */
    currentPeriodStart: Date
    /** Hora en la que termina el periodo actual. */
    currentPeriodEnd: Date
}

/**
 * Duración en horas del periodo ACTUAL. Para legacy es fija; para convenciones
 * de calendario se deriva de los anclajes reales (duración variable).
 */
const currentPeriodHours = (expense: FixedExpense, now: Date = new Date()): number => {
    const snapshot = computeAccrual(expense, now)
    const ms = snapshot.currentPeriodEnd.getTime() - snapshot.currentPeriodStart.getTime()
    return ms / MS_PER_HOUR
}

/** Tasa generada por una hora del periodo actual (monto / horas del periodo). */
export const ratePerHour = (expense: FixedExpense, now: Date = new Date()): Big => {
    const hours = isCalendarUnit(expense.period_unit)
        ? currentPeriodHours(expense, now)
        : totalPeriodHours(expense.period_quantity, expense.period_unit)
    if (hours <= 0) return new Big(0)
    return new Big(expense.amount).div(hours)
}

/** Tasa por día (24 × tasa horaria del periodo actual). */
export const ratePerDay = (expense: FixedExpense, now: Date = new Date()): Big =>
    ratePerHour(expense, now).times(HOURS_PER_DAY)

/**
 * Tasa legacy proyectada a 30 días (la unidad "mensual" del producto).
 * Solo aplica a unidades legacy de intervalo fijo.
 */
export const ratePerMonth = (expense: FixedExpense): Big => {
    const hours = totalPeriodHours(expense.period_quantity, expense.period_unit)
    if (hours <= 0) return new Big(0)
    return new Big(expense.amount).div(hours).times(HOURS_PER_DAY * 30)
}

/** Acumulado de una convención de calendario (duración de periodo variable). */
const computeCalendarAccrual = (expense: FixedExpense, now: Date): AccrualSnapshot => {
    const startMs = new Date(expense.start_date).getTime()
    const unit = expense.period_unit as 'semimonthly' | 'end_of_month'
    const schedule = computeCalendarSchedule(startMs, now.getTime(), unit)

    const amount = new Big(expense.amount)
    const periodMs = schedule.currentPeriodEnd - schedule.currentPeriodStart
    const elapsedInPeriod = now.getTime() - schedule.currentPeriodStart

    const progress = periodMs > 0 ? Math.min(1, Math.max(0, elapsedInPeriod / periodMs)) : 0
    // Recortado a [0, 1): el acumulado llega al monto completo justo en el corte,
    // momento en el que `completedPeriods` ya incorporó ese corte y el periodo
    // actual reinicia.
    const clampedProgress = Math.min(progress, 0.999999999)

    const accruedInCurrentPeriod = amount.times(clampedProgress)
    const accruedTotal = amount.times(schedule.completedPeriods).plus(accruedInCurrentPeriod)

    return {
        accruedTotal,
        accruedInCurrentPeriod,
        completedPeriods: schedule.completedPeriods,
        currentPeriodProgress: clampedProgress,
        currentPeriodStart: new Date(schedule.currentPeriodStart),
        currentPeriodEnd: new Date(schedule.currentPeriodEnd)
    }
}

/**
 * Calcula el estado de acumulación de un gasto fijo en el instante `now`.
 * Si `now <= start_date` todo queda en cero — el gasto aún no empezó a correr.
 */
export const computeAccrual = (expense: FixedExpense, now: Date = new Date()): AccrualSnapshot => {
    if (isCalendarUnit(expense.period_unit)) {
        return computeCalendarAccrual(expense, now)
    }

    // --- Branch legacy: intervalo fijo en horas absolutas (NO tocar). ---
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

    const rate = new Big(expense.amount).div(periodHours)
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

/**
 * Proyección mensual del gasto (§2.4):
 * - 'end_of_month' → amount; 'semimonthly' → amount × 2; legacy → tasa a 30 días.
 */
export const monthlyProjection = (expense: FixedExpense): number => {
    if (expense.period_unit === 'end_of_month') {
        return Number(new Big(expense.amount).toFixed(2))
    }
    if (expense.period_unit === 'semimonthly') {
        return Number(new Big(expense.amount).times(2).toFixed(2))
    }
    return Number(ratePerMonth(expense).toFixed(2))
}

/** Acumulado del periodo actual como número. */
export const accruedInPeriodNumber = (
    expense: FixedExpense,
    now: Date = new Date()
): number => Number(computeAccrual(expense, now).accruedInCurrentPeriod.toFixed(2))
