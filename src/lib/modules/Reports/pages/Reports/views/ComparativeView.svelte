<script lang="ts">
    import { ArrowLeft, ArrowRight, ArrowUpRight, BarChart3, CalendarRange } from '@lucide/svelte'
    import { formatCurrency } from '$lib/utils/numbers'
    import { getErrorMessage } from '$lib/utils/errors'
    import { formatShortDate } from '$lib/utils/dates'
    import FilterChips from '$lib/components/FilterChips.svelte'
    import BottomSheet from '$lib/components/BottomSheet.svelte'
    import { useComparativeReport } from '../hooks/useComparativeReport'
    import type { ComparativeGranularity, ComparativePeriod } from '$lib/api/requests/reports'
    import SegmentedTabs from '../components/SegmentedTabs.svelte'
    import ToolbarButton from '../components/ToolbarButton.svelte'
    import ReportState from '../components/ReportState.svelte'

    const GRANULARITY_OPTIONS = [
        { id: 'weekly', label: 'Semanal' },
        { id: 'biweekly', label: 'Quincenal' },
        { id: 'monthly', label: 'Mensual' },
        { id: 'quarterly', label: 'Trimestral' },
        { id: 'semiannual', label: 'Semestral' },
        { id: 'annual', label: 'Anual' }
    ] as const

    let granularity = $state<ComparativeGranularity>('monthly')
    let count = $state<2 | 3>(2)
    let offset = $state(0)
    let granOpen = $state(false)

    const query = useComparativeReport(() => ({ granularity, count, offset }))
    const data = $derived($query.data)
    const periods = $derived(data?.periods ?? [])

    const granLabel = $derived(GRANULARITY_OPTIONS.find((g) => g.id === granularity)?.label ?? 'Periodo')

    const periodBadge = (p: ComparativePeriod, i: number): { label: string; tone: string } => {
        if (i === 0) return { label: 'Base', tone: 'hsl(215, 16%, 47%)' }
        if (p.growth === null) return { label: 'Intermedio', tone: 'hsl(199, 89%, 45%)' }
        return { label: 'Actual', tone: 'hsl(217, 91%, 50%)' }
    }

    const deltaColor = (n: number): string =>
        n > 0 ? 'hsl(158, 64%, 38%)' : n < 0 ? 'hsl(0, 84%, 55%)' : 'hsl(215, 16%, 47%)'
    const signed = (n: number): string => `${n > 0 ? '+' : ''}${n.toFixed(1)}%`
</script>

<div class="flex flex-col gap-3 px-5 pb-8 pt-3">
    <!-- Controles -->
    <div class="flex items-center gap-2">
        <ToolbarButton icon={CalendarRange} label={granLabel} active onclick={() => (granOpen = true)} />
        <div class="w-24">
            <SegmentedTabs
                tabs={['2', '3']}
                value={count === 2 ? 0 : 1}
                onChange={(i) => (count = i === 0 ? 2 : 3)}
            />
        </div>
    </div>

    <!-- Navegación temporal -->
    <div class="flex items-center justify-between rounded-full border border-border bg-card px-2 py-1.5">
        <button
            type="button"
            onclick={() => (offset = offset + 1)}
            class="flex h-8 w-8 items-center justify-center rounded-full transition-opacity active:opacity-60"
            aria-label="Periodos anteriores"
        >
            <ArrowLeft size={18} color="hsl(215, 16%, 47%)" />
        </button>
        <span class="text-xs font-semibold text-foreground">
            {#if offset === 0}
                A la fecha
            {:else}
                {offset} periodo{offset === 1 ? '' : 's'} atrás
            {/if}
        </span>
        <div class="flex items-center gap-1">
            {#if offset > 0}
                <button
                    type="button"
                    onclick={() => (offset = 0)}
                    class="rounded-full px-2.5 py-1 text-xs font-semibold text-primary transition-opacity active:opacity-60"
                >
                    Hoy
                </button>
            {/if}
            <button
                type="button"
                disabled={!data?.canGoForward}
                onclick={() => (offset = Math.max(0, offset - 1))}
                class="flex h-8 w-8 items-center justify-center rounded-full transition-opacity active:opacity-60 disabled:opacity-30"
                aria-label="Periodos siguientes"
            >
                <ArrowRight size={18} color="hsl(215, 16%, 47%)" />
            </button>
        </div>
    </div>

    {#if $query.isLoading}
        <ReportState kind="loading" />
    {:else if $query.isError}
        <ReportState kind="error" message={getErrorMessage($query.error)} />
    {:else if periods.length === 0}
        <ReportState kind="empty" message="Sin datos para comparar en este periodo." />
    {:else}
        <div class="flex flex-col gap-3">
            {#each periods as p, i (p.from + p.to)}
                {@const badge = periodBadge(p, i)}
                <div
                    class="rounded-2xl border border-border bg-card p-4"
                    style="box-shadow:0 6px 12px hsla(222,47%,11%,0.05)"
                >
                    <div class="mb-3 flex items-start justify-between">
                        <div>
                            <p class="text-sm font-semibold text-foreground">{p.label}</p>
                            <p class="mt-0.5 text-[11px] text-muted-foreground">
                                {formatShortDate(p.from)} – {formatShortDate(p.to)}
                            </p>
                        </div>
                        <span
                            class="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                            style="color:{badge.tone};background-color:{badge.tone.replace(')', ', 0.12)').replace('hsl', 'hsla')}"
                        >
                            {badge.label}
                        </span>
                    </div>

                    <div class="grid grid-cols-3 gap-2">
                        <div>
                            <p class="text-[10px] text-muted-foreground">Ventas</p>
                            <p class="text-sm font-bold text-foreground">{formatCurrency(p.sales)}</p>
                        </div>
                        <div>
                            <p class="text-[10px] text-muted-foreground">Ganancia</p>
                            <p class="text-sm font-bold text-success">{formatCurrency(p.profit)}</p>
                        </div>
                        <div>
                            <p class="text-[10px] text-muted-foreground">Margen</p>
                            <p class="text-sm font-bold text-foreground">{p.margin.toFixed(1)}%</p>
                        </div>
                    </div>

                    {#if p.growth}
                        <div class="mt-3 grid grid-cols-3 gap-2 border-t border-border/60 pt-3">
                            <div class="flex items-center gap-1">
                                <ArrowUpRight size={12} color={deltaColor(p.growth.salesDelta)} />
                                <span class="text-[11px] font-semibold" style="color:{deltaColor(p.growth.salesDelta)}">
                                    {p.growth.salesPct === null ? '—' : signed(p.growth.salesPct)}
                                </span>
                            </div>
                            <div class="flex items-center gap-1">
                                <ArrowUpRight size={12} color={deltaColor(p.growth.profitDelta)} />
                                <span class="text-[11px] font-semibold" style="color:{deltaColor(p.growth.profitDelta)}">
                                    {p.growth.profitPct === null ? '—' : signed(p.growth.profitPct)}
                                </span>
                            </div>
                            <div class="flex items-center gap-1">
                                <ArrowUpRight size={12} color={deltaColor(p.growth.marginDelta)} />
                                <span class="text-[11px] font-semibold" style="color:{deltaColor(p.growth.marginDelta)}">
                                    {p.growth.marginDelta > 0 ? '+' : ''}{p.growth.marginDelta.toFixed(1)} pts
                                </span>
                            </div>
                        </div>
                        <p class="mt-1.5 text-[10px] text-muted-foreground">Crecimiento vs base</p>
                    {/if}
                </div>
            {/each}
        </div>

        <div class="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-muted-foreground">
            <BarChart3 size={12} color="hsl(215, 16%, 55%)" />
            Comparación {granLabel.toLowerCase()} · {count} periodos
        </div>
    {/if}
</div>

<BottomSheet open={granOpen} title="Granularidad" onClose={() => (granOpen = false)}>
    <div class="pb-1">
        <FilterChips
            options={GRANULARITY_OPTIONS}
            value={granularity}
            onChange={(v) => {
                granularity = v as ComparativeGranularity
                offset = 0
            }}
        />
    </div>
</BottomSheet>
