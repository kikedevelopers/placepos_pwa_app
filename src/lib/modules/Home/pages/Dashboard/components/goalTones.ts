import { Activity, TrendingDown, TrendingUp } from '@lucide/svelte'
import type { IconComponent } from '$lib/types/icon'
import type { GoalTone } from '../hooks/useBreakEvenProgress.svelte'

export const TONE_TEXT: Record<GoalTone, string> = {
    danger: 'text-destructive',
    warning: 'text-warning',
    success: 'text-success'
}

export const TONE_FILL: Record<GoalTone, string> = {
    danger: 'hsl(0, 84%, 55%)',
    warning: 'hsl(32, 95%, 44%)',
    success: 'hsl(158, 64%, 38%)'
}

export const TONE_BG: Record<GoalTone, string> = {
    danger: 'hsla(0, 84%, 55%, 0.10)',
    warning: 'hsla(32, 95%, 44%, 0.10)',
    success: 'hsla(158, 64%, 38%, 0.10)'
}

export const TONE_BORDER: Record<GoalTone, string> = {
    danger: 'hsla(0, 84%, 55%, 0.30)',
    warning: 'hsla(32, 95%, 44%, 0.30)',
    success: 'hsla(158, 64%, 38%, 0.30)'
}

export const TONE_ICON: Record<GoalTone, IconComponent> = {
    danger: TrendingDown,
    warning: Activity,
    success: TrendingUp
}
