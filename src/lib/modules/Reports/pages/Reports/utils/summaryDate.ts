import { formatDayMonth, parseDateKey } from '$lib/utils/calendarNames'

/**
 * Etiqueta del selector de día del Resumen: "Hoy", "Ayer" o "22 oct 2026".
 * `today` llega como YYYY-MM-DD para poder testear sin reloj.
 */
export function summaryDateLabel(date: string, today: string): string {
    if (date === today) return 'Hoy'
    const [y, m, d] = today.split('-').map(Number)
    const yesterday = new Date(y, m - 1, d - 1)
    const pad = (n: number) => String(n).padStart(2, '0')
    const yKey = `${yesterday.getFullYear()}-${pad(yesterday.getMonth() + 1)}-${pad(yesterday.getDate())}`
    if (date === yKey) return 'Ayer'
    return formatDayMonth(parseDateKey(date), true)
}
