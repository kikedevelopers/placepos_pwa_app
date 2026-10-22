import type { GoalTone } from '$lib/modules/Home/pages/Dashboard/utils/goalDerived'

export type MetricTone = 'asset' | 'liability' | 'info' | 'neutral'

// El color del monto dice si suma (activo) o resta (pasivo) al patrimonio.
export const TONE_TEXT: Record<MetricTone, string> = {
    asset: 'text-success',
    liability: 'text-destructive',
    info: 'text-info',
    neutral: 'text-foreground'
}

export const GOAL_TEXT: Record<GoalTone, string> = {
    danger: 'text-destructive',
    warning: 'text-warning',
    success: 'text-success'
}

export const GOAL_FILL: Record<GoalTone, string> = {
    danger: 'bg-destructive',
    warning: 'bg-warning',
    success: 'bg-success'
}
