<script lang="ts">
    import { formatCurrency } from '$lib/utils/numbers'
    import type { GoalTone } from '../hooks/useBreakEvenProgress.svelte'
    import { TONE_BG, TONE_BORDER, TONE_FILL, TONE_ICON, TONE_TEXT } from './goalTones'

    interface Props {
        dailyTarget: number
        dayRealProfit: number
        tone: GoalTone
        progressPct: number
        deficit: number
        surplus: number
        isReached: boolean
    }
    let { dailyTarget, dayRealProfit, tone, progressPct, deficit, surplus, isReached }: Props =
        $props()

    const Icon = $derived(TONE_ICON[tone])
</script>

<div class="mt-5 border-t border-border/60 pt-4">
    <p class="mb-3 text-[11px] uppercase tracking-[1px] text-muted-foreground/70">Hoy</p>

    <div class="mb-3 flex gap-3">
        <div class="flex-1 rounded-xl border border-border bg-secondary/40 p-3">
            <p class="text-[11px] uppercase tracking-[0.5px] text-muted-foreground/80">
                Cuota diaria
            </p>
            <p class="mt-1 text-base font-bold text-foreground">{formatCurrency(dailyTarget)}</p>
        </div>
        <div class="flex-1 rounded-xl border border-border bg-secondary/40 p-3">
            <p class="text-[11px] uppercase tracking-[0.5px] text-muted-foreground/80">
                Ganancia real hoy
            </p>
            <p class="mt-1 text-base font-bold text-foreground">{formatCurrency(dayRealProfit)}</p>
        </div>
    </div>

    <div
        class="flex items-center gap-3 rounded-xl border p-3"
        style="background-color:{TONE_BG[tone]};border-color:{TONE_BORDER[tone]}"
    >
        <Icon size={18} color={TONE_FILL[tone]} strokeWidth={2} />
        <div class="flex-1">
            <p class="text-[11px] font-semibold uppercase tracking-[0.5px] {TONE_TEXT[tone]}">
                {isReached ? '¡Meta lograda!' : 'Día en curso'}
            </p>
            <p class="text-sm font-bold {TONE_TEXT[tone]}">
                {isReached
                    ? `+${formatCurrency(surplus)}`
                    : `${progressPct.toFixed(0)}% · ${formatCurrency(deficit)} restantes`}
            </p>
        </div>
    </div>
</div>
