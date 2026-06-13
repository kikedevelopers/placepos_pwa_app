import {
    colombiaToday,
    customRangeLabel,
    dayRange,
    PRESET_LABELS,
    presetDays,
    type DateRange,
    type RangeMode,
    type RangePreset
} from '../utils/movementsRange'

export interface MovementsRange {
    readonly mode: RangeMode
    readonly customFrom: string
    readonly customTo: string
    readonly range: DateRange
    readonly label: string
    setPreset: (preset: RangePreset) => void
    setCustom: (from: string, to: string) => void
}

/**
 * Estado del filtro de fechas de movimientos. Por defecto muestra el día actual
 * (zona Colombia). Presets (hoy, ayer, últimos 7 días, este mes) + rango
 * personalizado. Expone `range` como instantes ISO para la query.
 */
export function useMovementsRange(): MovementsRange {
    let mode = $state<RangeMode>('today')
    let customFrom = $state(colombiaToday())
    let customTo = $state(colombiaToday())

    const days = $derived(
        mode === 'custom' ? { from: customFrom, to: customTo } : presetDays(mode)
    )
    const range = $derived(dayRange(days.from, days.to))
    const label = $derived(mode === 'custom' ? customRangeLabel(customFrom, customTo) : PRESET_LABELS[mode])

    return {
        get mode() {
            return mode
        },
        get customFrom() {
            return customFrom
        },
        get customTo() {
            return customTo
        },
        get range() {
            return range
        },
        get label() {
            return label
        },
        setPreset: (preset) => {
            mode = preset
        },
        setCustom: (from, to) => {
            const [a, b] = from <= to ? [from, to] : [to, from]
            customFrom = a
            customTo = b
            mode = 'custom'
        }
    }
}
