import type { FixedExpensePeriodUnit } from '$lib/api/requests/fixedExpenses'

/**
 * Cortes alineados al calendario (Camino A). Espejo EXACTO de placepos
 * (FixedExpenses/utils/periodSchedule.ts) y de los backends: anclas en hora
 * Colombia, comparadas como instantes absolutos.
 *
 * - 'end_of_month' (Mensual):  un corte el ÚLTIMO día de cada mes.
 * - 'semimonthly'  (Quincenal): dos cortes por mes — el día 15 y el último día.
 *
 * Cada ancla es fin del día en Bogotá (23:59:59.999). Solo cuentan las anclas
 * con `anchor > start` (estricto: crear el gasto justo en un ancla NO dispara
 * corte). Sin dayjs: Colombia no tiene horario de verano, su offset es fijo
 * `-05:00` (igual criterio que Finance/utils/movementsRange).
 */
export type CalendarPeriodUnit = 'semimonthly' | 'end_of_month'

const CO_OFFSET = '-05:00'

export const isCalendarUnit = (unit: FixedExpensePeriodUnit): unit is CalendarPeriodUnit =>
    unit === 'semimonthly' || unit === 'end_of_month'

const pad = (n: number): string => String(n).padStart(2, '0')

/** Fin del día (23:59:59.999) de una fecha en Bogotá, como ms epoch. */
const endOfDayCo = (year: number, month: number, day: number): number =>
    Date.parse(`${year}-${pad(month)}-${pad(day)}T23:59:59.999${CO_OFFSET}`)

const daysInMonth = (year: number, month: number): number => new Date(Date.UTC(year, month, 0)).getUTCDate()

/** Anclajes de un mes (mes 1-indexado) en zona Colombia. */
const monthAnchors = (year: number, month: number, unit: CalendarPeriodUnit): number[] => {
    const endOfMonth = endOfDayCo(year, month, daysInMonth(year, month))
    if (unit === 'end_of_month') return [endOfMonth]
    return [endOfDayCo(year, month, 15), endOfMonth]
}

/** Año y mes (1-12) de un instante, vistos en Bogotá. */
const yearMonthCo = (ms: number): { year: number; month: number } => {
    const d = new Date(ms - 5 * 3_600_000)
    return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 }
}

const MAX_MONTHS = 1200

/** Anclas > start hasta tener dos posteriores a `now` (periodo actual y siguiente). */
const buildAnchors = (startMs: number, nowMs: number, unit: CalendarPeriodUnit): number[] => {
    let { year, month } = yearMonthCo(startMs)
    const anchors: number[] = []
    let scanned = 0
    let afterNow = 0
    while (scanned < MAX_MONTHS && afterNow < 2) {
        for (const anchor of monthAnchors(year, month, unit)) {
            if (anchor > startMs) {
                anchors.push(anchor)
                if (anchor > nowMs) afterNow++
            }
        }
        month++
        if (month > 12) {
            month = 1
            year++
        }
        scanned++
    }
    return anchors
}

export interface CalendarSchedule {
    /** Cantidad de anclas a_k con a_k <= now. */
    completedPeriods: number
    /** Inicio del periodo actual (start si now < a1, si no el ancla previa). */
    currentPeriodStart: number
    /** Fin del periodo actual (la próxima ancla > now). */
    currentPeriodEnd: number
}

export const computeCalendarSchedule = (startMs: number, nowMs: number, unit: CalendarPeriodUnit): CalendarSchedule => {
    const anchors = buildAnchors(startMs, nowMs, unit)
    const a1 = anchors[0] ?? startMs
    if (nowMs <= startMs) return { completedPeriods: 0, currentPeriodStart: startMs, currentPeriodEnd: a1 }

    let completed = 0
    while (completed < anchors.length && anchors[completed] <= nowMs) completed++
    if (completed === 0) return { completedPeriods: 0, currentPeriodStart: startMs, currentPeriodEnd: a1 }

    const currentPeriodStart = anchors[completed - 1]
    return { completedPeriods: completed, currentPeriodStart, currentPeriodEnd: anchors[completed] ?? currentPeriodStart }
}

/** Los primeros `count` instantes de corte desde el inicio (vectores del contrato). */
export const calendarDueDates = (startMs: number, unit: CalendarPeriodUnit, count: number): number[] => {
    let { year, month } = yearMonthCo(startMs)
    const out: number[] = []
    let scanned = 0
    while (scanned < MAX_MONTHS && out.length < count) {
        for (const anchor of monthAnchors(year, month, unit)) {
            if (anchor > startMs && out.length < count) out.push(anchor)
        }
        month++
        if (month > 12) {
            month = 1
            year++
        }
        scanned++
    }
    return out
}
