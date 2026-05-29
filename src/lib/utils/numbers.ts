const DEFAULT_CURRENCY = 'COP'
const DEFAULT_LOCALE = 'es-CO'
const DEFAULT_DECIMALS = 2

/**
 * Formato de moneda alineado con placepos (COP / es-CO, sin decimales mínimos).
 * Redondea con Math.round a `decimals` para mostrar; los valores llegan ya
 * calculados desde el backend.
 */
export const formatCurrency = (
    value: number | string | undefined | null,
    decimals: number = DEFAULT_DECIMALS
): string => {
    const numeric = typeof value === 'string' ? Number(value) : value
    const safe = Number.isFinite(numeric) ? (numeric as number) : 0

    return new Intl.NumberFormat(DEFAULT_LOCALE, {
        style: 'currency',
        currency: DEFAULT_CURRENCY,
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals
    }).format(safe)
}

export const formatNumber = (value: number | undefined | null, maxDecimals = 2): string => {
    const safe = Number.isFinite(value) ? (value as number) : 0
    return new Intl.NumberFormat(DEFAULT_LOCALE, { maximumFractionDigits: maxDecimals }).format(safe)
}

/** Moneda compacta para cifras grandes (ej. "$12,4 mill."). Evita truncar. */
export const formatCompactCurrency = (value: number | undefined | null): string => {
    const safe = Number.isFinite(value) ? (value as number) : 0
    return new Intl.NumberFormat(DEFAULT_LOCALE, {
        style: 'currency',
        currency: DEFAULT_CURRENCY,
        notation: 'compact',
        maximumFractionDigits: 1
    }).format(safe)
}

/**
 * Convierte un string de input a número aceptando coma O punto decimal (el
 * teclado decimal en es-CO usa coma). Devuelve NaN si no es numérico.
 */
export const parseDecimal = (value: string): number => Number(value.replace(',', '.'))

/** Redondea a `decimals` evitando ruido de coma flotante (suficiente para POS). */
export const roundTo = (value: number, decimals = 2): number => {
    const factor = 10 ** decimals
    return Math.round((Number.isFinite(value) ? value : 0) * factor) / factor
}
