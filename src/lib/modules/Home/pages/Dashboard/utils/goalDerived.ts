import type { BreakEvenProgress } from '$lib/api/requests/dashboard'
import { computeMonthPace, expectedToDate, formatDayRange, type MonthPace } from './dashboardMath'

export type GoalTone = 'danger' | 'warning' | 'success'

export type BreakEvenDerived = {
    monthRange: string
    progressPct: number
    progressLabel: string
    tone: GoalTone
    isReached: boolean
    surplus: number
    deficit: number
    dayTone: GoalTone
    dayProgressPct: number
    dayDeficit: number
    daySurplus: number
    dayIsReached: boolean
    pace: MonthPace | null
    expectedToDate: number
    // Fracción (0..1) de la meta donde va la marca de ritmo esperado.
    paceShare: number
}

export const resolveTone = (progress: number): GoalTone => {
    if (progress >= 1) return 'success'
    if (progress >= 0.4) return 'warning'
    return 'danger'
}

/**
 * Formatea el % de avance de la meta. Antes de alcanzarla, TRUNCA (no redondea)
 * y CAPA justo por debajo de 100 (99.9% con 1 decimal, 99% con 0) para no mostrar
 * "100%" cuando aún falta (p.ej. 99.96% no debe leerse como meta lograda). Una vez
 * alcanzada, muestra el % real (puede superar 100). Espejo de la convención del
 * cliente desktop (placepos).
 */
export const formatGoalPercent = (pct: number, isReached: boolean, decimals = 1): string => {
    if (isReached) return `${pct.toFixed(decimals)}%`
    const factor = 10 ** decimals
    const cap = 100 - 1 / factor
    const truncated = Math.floor(Math.max(0, pct) * factor) / factor
    return `${Math.min(cap, truncated).toFixed(decimals)}%`
}

export const computeDerived = (data: BreakEvenProgress | undefined): BreakEvenDerived | null => {
    if (!data || !data.configured) return null
    const pace = computeMonthPace(data.monthFrom, data.monthTo)
    const expected = pace ? expectedToDate(data.dailyTarget, data.breakEvenAmount, pace) : 0
    return {
        monthRange: formatDayRange(data.monthFrom, data.monthTo),
        progressPct: data.monthProgress * 100,
        progressLabel: formatGoalPercent(data.monthProgress * 100, data.monthProgress >= 1, 1),
        tone: resolveTone(data.monthProgress),
        isReached: data.monthProgress >= 1,
        surplus: Math.max(0, data.monthRealProfit - data.breakEvenAmount),
        deficit: Math.max(0, data.breakEvenAmount - data.monthRealProfit),
        dayTone: resolveTone(data.dayProgress),
        dayProgressPct: data.dayProgress * 100,
        dayDeficit: Math.max(0, data.dailyTarget - data.dayRealProfit),
        daySurplus: Math.max(0, data.dayRealProfit - data.dailyTarget),
        dayIsReached: data.dayProgress >= 1,
        pace,
        expectedToDate: expected,
        paceShare: data.breakEvenAmount > 0 ? Math.min(1, expected / data.breakEvenAmount) : 0
    }
}
