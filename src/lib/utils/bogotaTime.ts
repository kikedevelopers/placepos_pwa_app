/**
 * Fechas en la hora del negocio (Colombia, America/Bogota). Colombia no tiene
 * horario de verano: siempre es UTC−5, así que basta con desplazar y leer en
 * UTC. Sin dependencias y determinista (los tests no dependen de la zona del
 * equipo).
 */
const BOGOTA_OFFSET_MS = -5 * 60 * 60 * 1000

const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const MONTHS = [
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
]
const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

export interface BogotaParts {
    year: number
    /** 0-11 */
    month: number
    day: number
    /** 0 = domingo */
    weekday: number
    hour: number
    minute: number
}

/** Partes de la fecha en Bogotá, o `null` si no es una fecha válida. */
export const bogotaParts = (value: string | number | Date): BogotaParts | null => {
    const ms = value instanceof Date ? value.getTime() : new Date(value).getTime()
    if (!Number.isFinite(ms)) return null
    const local = new Date(ms + BOGOTA_OFFSET_MS)
    return {
        year: local.getUTCFullYear(),
        month: local.getUTCMonth(),
        day: local.getUTCDate(),
        weekday: local.getUTCDay(),
        hour: local.getUTCHours(),
        minute: local.getUTCMinutes()
    }
}

/** Número de día (días desde la época) en Bogotá: para comparar "hoy", "ayer". */
export const bogotaDayNumber = (value: string | number | Date): number | null => {
    const parts = bogotaParts(value)
    if (!parts) return null
    return Math.floor(Date.UTC(parts.year, parts.month, parts.day) / 86_400_000)
}

/** "4:30 p. m." */
export const timeLabel = (parts: BogotaParts): string => {
    const hour12 = parts.hour % 12 === 0 ? 12 : parts.hour % 12
    const suffix = parts.hour < 12 ? 'a. m.' : 'p. m.'
    return `${hour12}:${String(parts.minute).padStart(2, '0')} ${suffix}`
}

/** "28 oct" (con año si no es el actual: "28 oct 2025"). */
export const shortDateLabel = (parts: BogotaParts, withYear = false): string =>
    `${parts.day} ${MONTHS_SHORT[parts.month]}${withYear ? ` ${parts.year}` : ''}`

/** "martes 28 de octubre, 4:30 p. m." */
export const longDateTimeLabel = (parts: BogotaParts): string =>
    `${WEEKDAYS[parts.weekday]} ${parts.day} de ${MONTHS[parts.month]}, ${timeLabel(parts)}`

export const weekdayName = (parts: BogotaParts): string => WEEKDAYS[parts.weekday]
