<script lang="ts">
    import { ArrowDownRight, ArrowUpRight, Minus } from '@lucide/svelte'
    import { cn } from '$lib/utils'
    import type { MetricComparison } from '../utils/comparisonModel'

    /**
     * Una métrica cara a cara (espejo de MetricComparison de placepos): cifra del
     * periodo actual, su variación contra el anterior y una barra por periodo con
     * el mismo largo relativo. El ojo compara largos, no números sueltos.
     */
    interface Props {
        metric: MetricComparison
        previousLabel: string | null
    }
    let { metric, previousLabel }: Props = $props()

    const latest = $derived(metric.bars[metric.bars.length - 1])
    const PILL = {
        positive: 'bg-success/10 text-success',
        negative: 'bg-destructive/10 text-destructive',
        neutral: 'bg-foreground/[0.06] text-muted-foreground'
    } as const
    const TEXT = { positive: 'text-success', negative: 'text-destructive', neutral: 'text-muted-foreground' } as const
</script>

<section class="surface px-5 pb-5 pt-[18px]" aria-label={`Comparación de ${metric.label}`}>
    <div class="flex items-center justify-between gap-3">
        <h3 class="text-[13px] font-medium text-muted-foreground">{metric.label}</h3>
        {#if metric.delta}
            <span class={cn('inline-flex h-6 items-center gap-0.5 rounded-full pl-1.5 pr-2 text-[12px] font-semibold tabular-nums', PILL[metric.delta.tone])}>
                {#if metric.delta.tone === 'positive'}<ArrowUpRight size={14} strokeWidth={2.5} />
                {:else if metric.delta.tone === 'negative'}<ArrowDownRight size={14} strokeWidth={2.5} />
                {:else}<Minus size={13} strokeWidth={2.5} />{/if}
                {metric.delta.primary}
            </span>
        {/if}
    </div>
    <p class="mt-1.5 truncate text-[28px] font-semibold leading-none tracking-[-0.03em] tabular-nums text-foreground">
        {latest?.value}
    </p>
    <p class="mt-2 min-h-[18px] truncate text-[12.5px] text-muted-foreground">
        {#if metric.delta && previousLabel}
            {#if metric.delta.secondary}
                <span class={cn('font-medium tabular-nums', TEXT[metric.delta.tone])}>{metric.delta.secondary}</span>
            {/if}
            frente a {previousLabel}
        {:else}
            {latest?.label}
        {/if}
    </p>

    <ul class="mt-4 space-y-3">
        {#each metric.bars as bar (bar.label)}
            <li>
                <div class="flex items-baseline justify-between gap-3 text-[12.5px]">
                    <span class="flex min-w-0 items-center gap-2">
                        <span aria-hidden="true" class="h-2 w-2 shrink-0 rounded-full" style="background-color:{bar.color}"></span>
                        <span class={cn('truncate', bar.role === 'latest' ? 'font-medium text-foreground' : 'text-muted-foreground')}>
                            {bar.label}
                        </span>
                    </span>
                    <span class={cn('shrink-0 tabular-nums', bar.role === 'latest' ? 'font-medium text-foreground' : 'text-muted-foreground')}>
                        {bar.value}
                    </span>
                </div>
                <div class="mt-1.5 h-2 overflow-hidden rounded-full bg-foreground/[0.06]" role="img" aria-label={`${metric.label} ${bar.label}: ${bar.value}`}>
                    <div class="bar-fill h-full w-full rounded-full" style="--fill:{bar.ratio};background-color:{bar.color}"></div>
                </div>
            </li>
        {/each}
    </ul>
</section>
