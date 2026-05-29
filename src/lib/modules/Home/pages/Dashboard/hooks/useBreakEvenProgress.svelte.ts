import { fromStore } from 'svelte/store'
import { createQuery } from '@tanstack/svelte-query'
import { getBreakEvenProgress, type BreakEvenProgress } from '$lib/api/requests/dashboard'
import { QUERY_KEYS } from '$lib/modules/Home/constants/queryKeys'

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
}

const resolveTone = (progress: number): GoalTone => {
    if (progress >= 1) return 'success'
    if (progress >= 0.4) return 'warning'
    return 'danger'
}

const formatRange = (from: string, to: string): string => {
    const fmt = (iso: string, withYear: boolean) =>
        new Intl.DateTimeFormat('es-CO', {
            day: 'numeric',
            month: 'short',
            ...(withYear ? { year: 'numeric' } : {})
        }).format(new Date(iso))
    return `${fmt(from, false)} – ${fmt(to, true)}`
}

const computeDerived = (data: BreakEvenProgress | undefined): BreakEvenDerived | null => {
    if (!data || !data.configured) return null
    return {
        monthRange: formatRange(data.monthFrom, data.monthTo),
        progressPct: data.monthProgress * 100,
        progressLabel: `${(data.monthProgress * 100).toFixed(1)}%`,
        tone: resolveTone(data.monthProgress),
        isReached: data.monthProgress >= 1,
        surplus: Math.max(0, data.monthRealProfit - data.breakEvenAmount),
        deficit: Math.max(0, data.breakEvenAmount - data.monthRealProfit),
        dayTone: resolveTone(data.dayProgress),
        dayProgressPct: data.dayProgress * 100,
        dayDeficit: Math.max(0, data.dailyTarget - data.dayRealProfit),
        daySurplus: Math.max(0, data.dayRealProfit - data.dailyTarget),
        dayIsReached: data.dayProgress >= 1
    }
}

/**
 * Debe llamarse durante la inicialización de un componente. `fromStore` adapta
 * el store de svelte-query a runes para que los getters sean reactivos.
 */
export const useBreakEvenProgress = (date?: string) => {
    const query = createQuery({
        queryKey: [...QUERY_KEYS.breakEven, date ?? 'today'],
        queryFn: () => getBreakEvenProgress(date),
        // Se detiene el polling si la última carga falló (no reintentar 4xx en bucle).
        refetchInterval: (q) => (q.state.status === 'error' ? false : 60_000)
    })
    const q = fromStore(query)

    return {
        get isLoading() {
            return q.current.isLoading
        },
        get isError() {
            return q.current.isError
        },
        get error() {
            return q.current.error
        },
        get data() {
            return q.current.data
        },
        get derived() {
            return computeDerived(q.current.data)
        }
    }
}
