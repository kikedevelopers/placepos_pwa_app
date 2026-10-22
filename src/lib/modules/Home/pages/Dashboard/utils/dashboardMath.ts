import Big from 'big.js'
import type { TodaySummary } from '$lib/api/requests/dashboard'

const DAY_RE = /^(\d{4})-(\d{2})-(\d{2})$/

/**
 * `YYYY-MM-DD` → Date LOCAL a medianoche. `new Date('2026-10-01')` se lee como
 * UTC y en Colombia (UTC-5) cae el día anterior ("30 sept" en vez de "1 oct").
 */
export const parseDay = (value: string): Date | null => {
    const match = DAY_RE.exec(value)
    if (!match) return null
    const [, y, m, d] = match.map(Number)
    const date = new Date(y, m - 1, d)
    return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d
        ? date
        : null
}

const monthShort = (date: Date): string =>
    new Intl.DateTimeFormat('es-CO', { month: 'short' }).format(date).replace('.', '')

/**
 * Rango compacto: "1 – 22 oct 2026" en el mismo mes, "28 sept – 3 oct 2026"
 * entre meses. Ante fechas inválidas devuelve el texto crudo.
 */
export const formatDayRange = (from: string, to: string): string => {
    const a = parseDay(from)
    const b = parseDay(to)
    if (!a || !b) return `${from} – ${to}`
    const end = `${b.getDate()} ${monthShort(b)} ${b.getFullYear()}`
    const sameMonth = a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()
    if (sameMonth) return `${a.getDate()} – ${end}`
    const sameYear = a.getFullYear() === b.getFullYear()
    return `${a.getDate()} ${monthShort(a)}${sameYear ? '' : ` ${a.getFullYear()}`} – ${end}`
}

export type MonthPace = {
    elapsed_days: number
    days_in_month: number
    // Fracción (0..1) del mes transcurrida, hoy incluido.
    share: number
}

/** Cuánto del mes ya pasó: marca dónde "debería" ir la meta si fuera pareja. */
export const computeMonthPace = (monthFrom: string, monthTo: string): MonthPace | null => {
    const from = parseDay(monthFrom)
    const to = parseDay(monthTo)
    if (!from || !to || to < from) return null
    const days_in_month = new Date(from.getFullYear(), from.getMonth() + 1, 0).getDate()
    const elapsed = Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1
    const elapsed_days = Math.min(days_in_month, elapsed)
    return {
        elapsed_days,
        days_in_month,
        share: Number(new Big(elapsed_days).div(days_in_month).toFixed(6))
    }
}

/**
 * Ganancia esperada a la fecha con el MISMO modelo de la cuota diaria del
 * backend (`dailyTarget = meta / días del período`): cuota × días transcurridos,
 * topada en la meta. Así la marca de la barra y la cuota de "Hoy" cuadran.
 */
export const expectedToDate = (dailyTarget: number, goal: number, pace: MonthPace): number => {
    if (!(dailyTarget > 0) || !(goal > 0)) return 0
    const expected = new Big(dailyTarget).times(pace.elapsed_days)
    return Number((expected.gt(goal) ? new Big(goal) : expected).round(2).toString())
}

export type SalesSegmentKey = 'cash' | 'transfer' | 'credit' | 'orders'

export type SalesSegment = {
    key: SalesSegmentKey
    label: string
    value: number
    // Fracción (0..1) del total de ventas del día.
    share: number
}

const share = (part: number, whole: number): number => {
    if (!(whole > 0) || !(part > 0)) return 0
    return Math.min(1, Number(new Big(part).div(whole).toFixed(6)))
}

/**
 * Composición de las ventas del día (DEVENGADO): contado, consignaciones,
 * créditos y pedidos. Crédito y pedidos solo aparecen si hubo (igual que las
 * filas de antes). Las fracciones son sobre `totalSales`, que ya los incluye.
 */
export const buildSalesComposition = (
    today: Pick<TodaySummary, 'cashSales' | 'transferSales' | 'creditSales' | 'ordersTotal' | 'totalSales'>
): SalesSegment[] => {
    const rows: Omit<SalesSegment, 'share'>[] = [
        { key: 'cash', label: 'Ventas en efectivo', value: today.cashSales },
        { key: 'transfer', label: 'Consignaciones', value: today.transferSales }
    ]
    if (today.creditSales > 0) rows.push({ key: 'credit', label: 'Créditos del día', value: today.creditSales })
    if ((today.ordersTotal ?? 0) > 0) {
        rows.push({ key: 'orders', label: 'Pedidos (facturación)', value: today.ordersTotal ?? 0 })
    }
    return rows.map((r) => ({ ...r, share: share(r.value, today.totalSales) }))
}

/** Fracción (0..1) acotada para barras de progreso. */
export const clampShare = (value: number): number =>
    Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0
