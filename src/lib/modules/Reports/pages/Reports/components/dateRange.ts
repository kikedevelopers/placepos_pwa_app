import { todayISO } from '$lib/utils/dates'

/**
 * Sistema de rango de fechas para Informes. Presets de paridad con placepos
 * (Semana/Quincena/Mes/Trimestre/Semestre/Año) + modo `custom` para rango
 * manual. Todo se calcula en fecha LOCAL (los endpoints esperan `YYYY-MM-DD`).
 */
export type RangeMode = 'today' | 'week' | 'biweek' | 'month' | 'quarter' | 'semester' | 'year' | 'custom'

export interface DateRangeValue {
    mode: RangeMode
    from: string
    to: string
}

export const RANGE_PRESETS: { id: Exclude<RangeMode, 'custom'>; label: string }[] = [
    { id: 'today', label: 'Hoy' },
    { id: 'week', label: 'Semana' },
    { id: 'biweek', label: 'Quincena' },
    { id: 'month', label: 'Mes' },
    { id: 'quarter', label: 'Trimestre' },
    { id: 'semester', label: 'Semestre' },
    { id: 'year', label: 'Año' }
]

const pad = (n: number): string => String(n).padStart(2, '0')
const iso = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** Lunes como inicio de semana (getDay: 0=Dom..6=Sáb). */
const startOfWeek = (d: Date): Date => {
    const diff = d.getDay() === 0 ? 6 : d.getDay() - 1
    const r = new Date(d)
    r.setDate(d.getDate() - diff)
    return r
}

/** Rango `[inicio, hoy]` de un preset (todos van "a la fecha", como placepos). */
export const presetRange = (mode: Exclude<RangeMode, 'custom'>): { from: string; to: string } => {
    const now = new Date()
    const to = iso(now)
    const y = now.getFullYear()
    const m = now.getMonth()
    const day = now.getDate()
    switch (mode) {
        case 'today':
            return { from: to, to }
        case 'week':
            return { from: iso(startOfWeek(now)), to }
        case 'biweek':
            return { from: iso(new Date(y, m, day <= 15 ? 1 : 16)), to }
        case 'month':
            return { from: iso(new Date(y, m, 1)), to }
        case 'quarter':
            return { from: iso(new Date(y, Math.floor(m / 3) * 3, 1)), to }
        case 'semester':
            return { from: iso(new Date(y, m < 6 ? 0 : 6, 1)), to }
        case 'year':
            return { from: iso(new Date(y, 0, 1)), to }
    }
}

export const makeRange = (mode: RangeMode): DateRangeValue => {
    if (mode === 'custom') {
        const t = todayISO()
        return { mode, from: t, to: t }
    }
    return { mode, ...presetRange(mode) }
}

export const rangeLabel = (v: DateRangeValue): string =>
    v.mode === 'custom' ? 'Personalizado' : (RANGE_PRESETS.find((p) => p.id === v.mode)?.label ?? 'Rango')
