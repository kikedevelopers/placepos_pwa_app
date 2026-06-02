import type { FixedExpensePeriodUnit } from '$lib/api/requests/fixedExpenses'

export interface PeriodUnitMeta {
    value: FixedExpensePeriodUnit
    /** Etiqueta singular del cuantificador (1 hora, 1 día, ...) */
    singular: string
    /** Etiqueta plural del cuantificador (2 horas, 2 días, ...) */
    plural: string
    /** Cuántas horas dura una unidad. Mes = 30 días por convención del producto. */
    hoursPerUnit: number
}

export const PERIOD_UNIT_META: Record<FixedExpensePeriodUnit, PeriodUnitMeta> = {
    hour: { value: 'hour', singular: 'hora', plural: 'horas', hoursPerUnit: 1 },
    day: { value: 'day', singular: 'día', plural: 'días', hoursPerUnit: 24 },
    week: { value: 'week', singular: 'semana', plural: 'semanas', hoursPerUnit: 24 * 7 },
    month: { value: 'month', singular: 'mes', plural: 'meses', hoursPerUnit: 24 * 30 }
}

export const PERIOD_UNIT_OPTIONS: PeriodUnitMeta[] = [
    PERIOD_UNIT_META.hour,
    PERIOD_UNIT_META.day,
    PERIOD_UNIT_META.week,
    PERIOD_UNIT_META.month
]

export const labelForPeriod = (
    quantity: number,
    unit: FixedExpensePeriodUnit
): string => {
    const meta = PERIOD_UNIT_META[unit]
    const noun = quantity === 1 ? meta.singular : meta.plural
    return quantity === 1 ? `Cada ${noun}` : `Cada ${quantity} ${noun}`
}
