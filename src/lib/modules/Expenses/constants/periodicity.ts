import type { FixedExpensePeriodUnit } from '$lib/api/requests/fixedExpenses'

// Espejo de placepos (FixedExpenses/constants/periodicity.ts).
export interface PeriodUnitMeta {
    value: FixedExpensePeriodUnit
    /** Etiqueta singular del cuantificador (1 hora, 1 día, ...) */
    singular: string
    /** Etiqueta plural del cuantificador (2 horas, 2 días, ...) */
    plural: string
    /**
     * Cuántas horas dura una unidad de intervalo fijo. Mes = 30 días por
     * convención del producto. Las de calendario tienen duración VARIABLE: no
     * lo definen y se calculan con periodSchedule.
     */
    hoursPerUnit?: number
    /** True para convenciones alineadas al calendario (Quincenal / Mensual). */
    isCalendar?: boolean
    /** Texto fijo para el selector y la tarjeta (convenciones). */
    label?: string
}

export const PERIOD_UNIT_META: Record<FixedExpensePeriodUnit, PeriodUnitMeta> = {
    semimonthly: {
        value: 'semimonthly',
        singular: 'quincena',
        plural: 'quincenas',
        isCalendar: true,
        label: 'Quincenal (día 15 y último)'
    },
    end_of_month: {
        value: 'end_of_month',
        singular: 'mes',
        plural: 'meses',
        isCalendar: true,
        label: 'Mensual (último día del mes)'
    },
    hour: { value: 'hour', singular: 'hora', plural: 'horas', hoursPerUnit: 1 },
    day: { value: 'day', singular: 'día', plural: 'días', hoursPerUnit: 24 },
    week: { value: 'week', singular: 'semana', plural: 'semanas', hoursPerUnit: 24 * 7 },
    month: { value: 'month', singular: 'mes', plural: 'meses', hoursPerUnit: 24 * 30 }
}

/** Orden del selector: primero las de calendario, luego las de intervalo fijo. */
export const PERIOD_UNIT_OPTIONS: PeriodUnitMeta[] = [
    PERIOD_UNIT_META.semimonthly,
    PERIOD_UNIT_META.end_of_month,
    PERIOD_UNIT_META.hour,
    PERIOD_UNIT_META.day,
    PERIOD_UNIT_META.week,
    PERIOD_UNIT_META.month
]

/** Unidad desconocida (backend más nuevo): se trata como mensual de 30 días en vez de romper. */
const metaOf = (unit: FixedExpensePeriodUnit): PeriodUnitMeta => PERIOD_UNIT_META[unit] ?? PERIOD_UNIT_META.month

export const labelForPeriod = (quantity: number, unit: FixedExpensePeriodUnit): string => {
    const meta = metaOf(unit)
    if (meta.isCalendar) return meta.label ?? meta.singular
    const noun = quantity === 1 ? meta.singular : meta.plural
    return quantity === 1 ? `Cada ${noun}` : `Cada ${quantity} ${noun}`
}

export const hoursPerUnitOf = (unit: FixedExpensePeriodUnit): number => metaOf(unit).hoursPerUnit ?? 0
