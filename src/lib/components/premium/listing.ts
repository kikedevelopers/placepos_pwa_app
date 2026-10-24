import { WEEKDAYS_SHORT, formatDayMonth, parseDateKey } from '$lib/utils/calendarNames'

/**
 * Utilidades de listados largos del kit premium (puras y testeadas).
 */

const pad = (n: number): string => String(n).padStart(2, '0')

/** Clave de día LOCAL (`YYYY-MM-DD`) de un instante ISO. */
export const dayKey = (iso: string): string => {
    const d = new Date(iso)
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const keyOf = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** "Hoy", "Ayer" o "mié, 22 oct" (con año si no es el actual). */
export const dayLabel = (key: string, now: Date = new Date()): string => {
    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    if (key === keyOf(now)) return 'Hoy'
    if (key === keyOf(yesterday)) return 'Ayer'
    const date = parseDateKey(key)
    return `${WEEKDAYS_SHORT[date.getDay()]}, ${formatDayMonth(date, date.getFullYear() !== now.getFullYear())}`
}

/** Fecha compacta: "16 oct" (año en curso) o "27 may 2025". */
export const shortDate = (iso: string, now: Date = new Date()): string => {
    const d = new Date(iso)
    return formatDayMonth(d, d.getFullYear() !== now.getFullYear())
}

/** Hora corta ("3:45 p. m."). */
export const timeLabel = (iso: string): string =>
    new Intl.DateTimeFormat('es-CO', { hour: 'numeric', minute: '2-digit' }).format(new Date(iso))

export interface DayGroup<T> {
    key: string
    label: string
    items: T[]
}

/**
 * Agrupa por día CONSERVANDO el orden de llegada (el backend ya ordena). Un día
 * que reaparece más abajo se une a su grupo existente.
 */
export function groupByDay<T>(
    items: readonly T[],
    getISO: (item: T) => string,
    now: Date = new Date()
): DayGroup<T>[] {
    const groups: DayGroup<T>[] = []
    const index = new Map<string, DayGroup<T>>()
    for (const item of items) {
        const key = dayKey(getISO(item))
        let group = index.get(key)
        if (!group) {
            group = { key, label: dayLabel(key, now), items: [] }
            index.set(key, group)
            groups.push(group)
        }
        group.items.push(item)
    }
    return groups
}

/** Siguiente límite de una lista progresiva (nunca pasa del total). */
export const nextLimit = (current: number, step: number, total: number): number =>
    Math.min(total, Math.max(current, 0) + Math.max(step, 1))
