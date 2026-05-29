import { daysAgoISO, monthStartISO, todayISO } from '$lib/utils/dates'

export type RangePreset = 'today' | '7d' | 'month'

export const RANGE_PRESET_OPTIONS: { id: RangePreset; label: string }[] = [
    { id: 'today', label: 'Hoy' },
    { id: '7d', label: '7 días' },
    { id: 'month', label: 'Este mes' }
]

export const rangeForPreset = (preset: RangePreset): { dateFrom: string; dateTo: string } => {
    if (preset === '7d') return { dateFrom: daysAgoISO(6), dateTo: todayISO() }
    if (preset === 'month') return { dateFrom: monthStartISO(), dateTo: todayISO() }
    return { dateFrom: todayISO(), dateTo: todayISO() }
}
