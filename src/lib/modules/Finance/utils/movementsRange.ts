/**
 * Rango de fechas para la lista de movimientos. El corte del día se ancla a la
 * zona del negocio (America/Bogota). Como Colombia no tiene horario de verano,
 * su offset es fijo `-05:00`, así que construimos los instantes ISO con ese
 * offset literal (sin depender de dayjs) — equivalente al cálculo de placepos.
 */
export type RangePreset = 'today' | 'yesterday' | 'last7' | 'thisMonth'
export type RangeMode = RangePreset | 'custom'

/** Rango como instantes absolutos (ISO/UTC) listos para el backend. */
export interface DateRange {
    from: string
    to: string
}

const CO_OFFSET = '-05:00'

/** Día actual en Colombia como 'YYYY-MM-DD', sin importar la zona del equipo. */
export const colombiaToday = (): string =>
    new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date())

/** Suma (o resta) días a un 'YYYY-MM-DD' de forma segura en UTC. */
const addDays = (day: string, delta: number): string => {
    const d = new Date(`${day}T00:00:00Z`)
    d.setUTCDate(d.getUTCDate() + delta)
    return d.toISOString().slice(0, 10)
}

const monthStart = (day: string): string => `${day.slice(0, 7)}-01`

/** Instantes ISO del rango [fromDay 00:00, toDay 23:59:59.999] en hora Colombia. */
export const dayRange = (fromDay: string, toDay: string): DateRange => ({
    from: new Date(`${fromDay}T00:00:00.000${CO_OFFSET}`).toISOString(),
    to: new Date(`${toDay}T23:59:59.999${CO_OFFSET}`).toISOString()
})

/** Días [from, to] de un preset (anclados a "hoy" en Colombia). */
export const presetDays = (preset: RangePreset): { from: string; to: string } => {
    const today = colombiaToday()
    switch (preset) {
        case 'today':
            return { from: today, to: today }
        case 'yesterday': {
            const y = addDays(today, -1)
            return { from: y, to: y }
        }
        case 'last7':
            return { from: addDays(today, -6), to: today }
        case 'thisMonth':
            return { from: monthStart(today), to: today }
    }
}

export const PRESET_LABELS: Record<RangePreset, string> = {
    today: 'Hoy',
    yesterday: 'Ayer',
    last7: 'Últimos 7 días',
    thisMonth: 'Este mes'
}

const SHORT_DAY = new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short' })

/** Etiqueta legible de un rango personalizado (p. ej. "12 jun – 13 jun"). */
export const customRangeLabel = (fromDay: string, toDay: string): string => {
    const from = SHORT_DAY.format(new Date(`${fromDay}T12:00:00`))
    if (fromDay === toDay) return from
    return `${from} – ${SHORT_DAY.format(new Date(`${toDay}T12:00:00`))}`
}
