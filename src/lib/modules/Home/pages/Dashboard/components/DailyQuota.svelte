<script lang="ts">
    import { Activity, TrendingDown, TrendingUp } from '@lucide/svelte'
    import { formatCurrency } from '$lib/utils/numbers'
    import {
        formatGoalPercent,
        type GoalTone
    } from '$lib/modules/Home/pages/Dashboard/utils/goalDerived'
    import ProgressBar from './ui/ProgressBar.svelte'
    import { GOAL_FILL, GOAL_TEXT } from './ui/tones'

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

    const ICON = { danger: TrendingDown, warning: Activity, success: TrendingUp }
    const Icon = $derived(ICON[tone])
</script>

<!-- Franja "Hoy": dos cifras lado a lado y el estado del día con su barra. -->
<div class="mt-5 border-t border-border/70 pt-4">
    <h3 class="text-[13px] font-semibold text-foreground">Hoy</h3>

    <!-- Lado a lado desde 380px; en pantallas más angostas, una fila por cifra
         (etiqueta a la izquierda, monto a la derecha) para no partir el número. -->
    <dl class="mt-3 grid grid-cols-1 gap-2 min-[380px]:grid-cols-2 min-[380px]:gap-0 min-[380px]:divide-x min-[380px]:divide-border/70">
        {#each [{ label: 'Cuota diaria', value: dailyTarget }, { label: 'Ganancia real hoy', value: dayRealProfit }] as cell, i (cell.label)}
            <div
                class="flex min-w-0 items-baseline justify-between gap-3 min-[380px]:block {i === 0
                    ? 'min-[380px]:pr-4'
                    : 'min-[380px]:pl-4'}"
            >
                <dt class="text-[12px] text-muted-foreground">{cell.label}</dt>
                <dd
                    class="mt-1 whitespace-nowrap text-[clamp(15px,4.2vw,17px)] font-semibold tabular-nums tracking-[-0.02em] text-foreground"
                >
                    {formatCurrency(cell.value)}
                </dd>
            </div>
        {/each}
    </dl>

    <div class="mt-4">
        <p class="flex flex-wrap items-center gap-1.5 text-[13px] font-semibold tabular-nums [overflow-wrap:anywhere] {GOAL_TEXT[tone]}">
            <Icon size={15} strokeWidth={2} />
            {#if isReached}
                ¡Meta lograda! · +{formatCurrency(surplus)}
            {:else}
                {formatGoalPercent(progressPct, false, 0)} · faltan {formatCurrency(deficit)}
            {/if}
        </p>
        <ProgressBar
            class="mt-2 h-1.5"
            value={progressPct / 100}
            fillClass={GOAL_FILL[tone]}
            ariaLabel="Avance de la cuota de hoy"
            valueText={formatGoalPercent(progressPct, isReached, 0)}
        />
    </div>
</div>
