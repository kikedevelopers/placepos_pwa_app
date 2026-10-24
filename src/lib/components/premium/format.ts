import { formatCurrency } from '$lib/utils/numbers'

/**
 * Piezas de presentación de cifras para el kit premium. Puras (sin DOM) para
 * poder testearlas: la UI solo decide tamaños y colores.
 */

export type Trend = 'up' | 'down' | 'flat'

export interface MoneyParts {
    negative: boolean
    /** Símbolo de moneda ("$"): se pinta más pequeño y atenuado. */
    symbol: string
    /** Parte entera con separadores de miles ("6.450"). */
    integer: string
    /** Decimales con su separador (",50") o "" si no hay. */
    fraction: string
}

/**
 * Parte un monto en símbolo / entero / decimales usando EXACTAMENTE el mismo
 * formato que `formatCurrency` (es-CO, COP). Así la cifra grande nunca difiere
 * de la que se ve en el resto de la app.
 */
export function splitMoney(value: number | null | undefined, decimals = 2): MoneyParts {
    const safe = Number.isFinite(value) ? (value as number) : 0
    const negative = safe < 0
    const formatted = formatCurrency(Math.abs(safe), decimals).replace(/ /g, ' ')
    const match = /^(\D*?)\s*([\d.]+)(,\d+)?\s*$/.exec(formatted)
    if (!match) return { negative, symbol: '$', integer: formatted, fraction: '' }
    return {
        negative: negative && formatted !== '$ 0',
        symbol: match[1].trim() || '$',
        integer: match[2],
        fraction: match[3] ?? ''
    }
}

/** Tendencia de una variación (con tolerancia para el ruido de redondeo). */
export function trendOf(delta: number | null | undefined, epsilon = 0.005): Trend {
    if (delta == null || !Number.isFinite(delta) || Math.abs(delta) < epsilon) return 'flat'
    return delta > 0 ? 'up' : 'down'
}

/** Porcentaje con signo explícito y 1 decimal ("+12,5 %", "−3,0 %"). */
export function signedPercent(value: number | null | undefined): string {
    if (value == null || !Number.isFinite(value)) return '—'
    const abs = Math.abs(value).toLocaleString('es-CO', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    })
    if (trendOf(value) === 'flat') return `${abs} %`
    return `${value > 0 ? '+' : '−'}${abs} %`
}

/** Porcentaje simple con 1 decimal ("25,0 %"). */
export function percent(value: number | null | undefined): string {
    const safe = Number.isFinite(value) ? (value as number) : 0
    return `${safe.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`
}

/** Plural español simple: `plural(1, 'venta')` → "1 venta"; 3 → "3 ventas". */
export function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
    return `${count.toLocaleString('es-CO')} ${count === 1 ? singular : pluralForm}`
}
