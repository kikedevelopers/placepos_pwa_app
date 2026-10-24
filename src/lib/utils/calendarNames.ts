/**
 * Nombres de meses y días en español, FIJOS (no `Intl`): así las fechas de la
 * PWA salen idénticas a las de placepos (dayjs 'es') en cualquier navegador.
 * `Intl` en es-CO, por ejemplo, abrevia septiembre como "sept.".
 */
export const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'] as const

export const MONTHS_LONG = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre'
] as const

export const WEEKDAYS_SHORT = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'] as const

/** "YYYY-MM-DD" → Date local (sin correrse por zona horaria). */
export const parseDateKey = (key: string): Date => {
    const [y, m, d] = key.split('-').map(Number)
    return new Date(y, (m || 1) - 1, d || 1)
}

/** "16 oct" o, con año, "16 oct 2026". */
export const formatDayMonth = (d: Date, withYear = false): string =>
    `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}${withYear ? ` ${d.getFullYear()}` : ''}`
