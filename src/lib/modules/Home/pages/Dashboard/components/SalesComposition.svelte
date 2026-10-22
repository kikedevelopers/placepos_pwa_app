<script lang="ts">
    import { cn } from '$lib/utils'
    import { formatCurrency, formatNumber } from '$lib/utils/numbers'
    import type { SalesSegment, SalesSegmentKey } from '../utils/dashboardMath'

    interface Props {
        segments: SalesSegment[]
        // Aclaraciones por tramo (ganancia del crédito, pedidos sin cobrar).
        hints?: Partial<Record<SalesSegmentKey, string>>
    }
    let { segments, hints = {} }: Props = $props()

    const FILL: Record<SalesSegmentKey, string> = {
        cash: 'bg-primary',
        transfer: 'bg-info',
        credit: 'bg-warning',
        orders: 'bg-muted-foreground/40'
    }

    // Un tramo con valor nunca se pinta más angosto que esto: debe poder verse.
    const MIN_SHARE = 0.02
    const visible = $derived(segments.filter((s) => s.value > 0))
</script>

<!--
    Una sola barra apilada con la mezcla del día y su leyenda, que ES el
    desglose: cada fila trae su color, monto y peso dentro del total.
-->
{#if visible.length > 0}
    <div
        class="flex h-2.5 w-full gap-[3px] overflow-hidden rounded-full"
        role="img"
        aria-label={visible.map((s) => `${s.label}: ${formatCurrency(s.value)}`).join(', ')}
    >
        {#each visible as s (s.key)}
            <div class="h-full {FILL[s.key]}" style="flex:{Math.max(s.share, MIN_SHARE)} 1 0%"></div>
        {/each}
    </div>
{:else}
    <div class="h-2.5 w-full rounded-full bg-muted" aria-hidden="true"></div>
{/if}

<dl class="mt-3">
    {#each segments as s (s.key)}
        <div class="flex items-baseline justify-between gap-3 py-1.5">
            <dt class="min-w-0">
                <span class="flex items-center gap-2 text-[13px] text-muted-foreground">
                    <span class={cn('h-2 w-2 shrink-0 rounded-full', FILL[s.key])}></span>
                    {s.label}
                </span>
                {#if hints[s.key]}
                    <span class="ml-4 mt-0.5 block text-[11.5px] text-muted-foreground">{hints[s.key]}</span>
                {/if}
            </dt>
            <dd class="flex shrink-0 items-baseline gap-2 tabular-nums">
                <span class="text-[11.5px] text-muted-foreground">{formatNumber(s.share * 100, 0)}%</span>
                <span class="text-[13.5px] font-medium {s.value < 0 ? 'text-destructive' : 'text-success'}">{formatCurrency(s.value)}</span>
            </dd>
        </div>
    {/each}
</dl>
