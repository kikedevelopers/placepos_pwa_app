<script lang="ts">
    import { CheckCircle2, Target } from '@lucide/svelte'
    import { formatCurrency } from '$lib/utils/numbers'
    import { getErrorMessage } from '$lib/utils/errors'
    import { useBreakEvenProgress } from '../hooks/useBreakEvenProgress.svelte'
    import DashCard from './ui/DashCard.svelte'
    import CardState from './ui/CardState.svelte'
    import ProgressBar from './ui/ProgressBar.svelte'
    import { GOAL_FILL, GOAL_TEXT } from './ui/tones'
    import DailyQuota from './DailyQuota.svelte'

    const goal = useBreakEvenProgress()
</script>

{#if goal.isLoading}
    <CardState title="Meta del mes" status="loading" rows={5} />
{:else if goal.isError}
    <CardState
        title="Meta del mes"
        status="error"
        message={getErrorMessage(goal.error) ?? 'No se pudo cargar la meta del mes.'}
        onRetry={() => goal.refetch()}
    />
{:else if !goal.data || !goal.data.configured || !goal.derived}
    <DashCard title="Meta del mes">
        <div class="flex items-start gap-3 rounded-2xl border border-dashed border-border p-4">
            <span class="mt-0.5 shrink-0"><Target size={20} strokeWidth={1.75} color="hsl(var(--primary))" /></span>
            <div>
                <p class="text-[14px] font-medium text-foreground">Configura tu punto de equilibrio</p>
                <p class="mt-1 text-[12.5px] leading-snug text-muted-foreground">
                    Hazlo desde placepos para ver aquí el avance del mes y la cuota de cada día.
                </p>
            </div>
        </div>
    </DashCard>
{:else}
    {@const data = goal.data}
    {@const d = goal.derived}
    {@const showPace = !!d.pace && !d.isReached}
    <DashCard title="Meta del mes" description={d.monthRange}>
        {#snippet actions()}
            <span class="text-[20px] font-semibold leading-none tabular-nums tracking-[-0.02em] {GOAL_TEXT[d.tone]}">
                {d.progressLabel}
            </span>
        {/snippet}

        <p class="text-[12.5px] text-muted-foreground">Ganancia real del mes</p>
        <p class="mt-1 flex flex-wrap items-baseline gap-x-2">
            <span class="text-[clamp(24px,8vw,32px)] font-semibold leading-none tabular-nums tracking-[-0.03em] text-foreground [overflow-wrap:anywhere]">
                {formatCurrency(data.monthRealProfit)}
            </span>
            <span class="text-[13px] tabular-nums text-muted-foreground">
                de {formatCurrency(data.breakEvenAmount)}
            </span>
        </p>

        <ProgressBar
            class="mt-5 h-2.5"
            value={d.progressPct / 100}
            fillClass={GOAL_FILL[d.tone]}
            marker={showPace ? d.paceShare : undefined}
            valueText={d.progressLabel}
            ariaLabel="Avance de la meta del mes"
        />

        <div class="mt-3 space-y-1.5 text-[12.5px]">
            {#if d.isReached}
                <p class="flex items-center gap-1.5 font-medium text-success">
                    <CheckCircle2 size={15} strokeWidth={2} />
                    Meta superada · {formatCurrency(d.surplus)} por encima
                </p>
            {:else}
                <p class="flex items-baseline justify-between gap-3 text-muted-foreground">
                    <span>Faltan para la meta</span>
                    <span class="shrink-0 font-semibold tabular-nums text-foreground">
                        {formatCurrency(d.deficit)}
                    </span>
                </p>
            {/if}
            {#if showPace && d.pace}
                <p class="flex items-baseline justify-between gap-3 text-muted-foreground">
                    <span class="flex min-w-0 items-center gap-2">
                        <span aria-hidden="true" class="h-3 w-0.5 shrink-0 rounded-full bg-foreground/70"></span>
                        <span class="whitespace-nowrap">
                            Ritmo esperado
                            <span class="hidden tabular-nums min-[400px]:inline">
                                · día {d.pace.elapsed_days} de {d.pace.days_in_month}
                            </span>
                        </span>
                    </span>
                    <span class="shrink-0 font-medium tabular-nums text-foreground">
                        {formatCurrency(d.expectedToDate)}
                    </span>
                </p>
            {/if}
        </div>

        <DailyQuota
            dailyTarget={data.dailyTarget}
            dayRealProfit={data.dayRealProfit}
            tone={d.dayTone}
            progressPct={d.dayProgressPct}
            deficit={d.dayDeficit}
            surplus={d.daySurplus}
            isReached={d.dayIsReached}
        />
    </DashCard>
{/if}
