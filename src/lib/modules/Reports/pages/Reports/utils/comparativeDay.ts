import { parseDateKey } from '$lib/utils/calendarNames'

/** Días del mes de una fecha `YYYY-MM-DD` (28..31): tope del selector de día. */
export const daysInMonthOf = (dateKey: string): number => {
    const d = parseDateKey(dateKey)
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
}
