<script lang="ts">
    import { BarChart3, ChevronLeft, ChevronRight, Layers } from '@lucide/svelte'
    import { getErrorMessage } from '$lib/utils/errors'
    import { todayISO } from '$lib/utils/dates'
    import { formatCurrency } from '$lib/utils/numbers'
    import type { ComparativeGranularity } from '$lib/api/requests/reports'
    import BottomSheet from '$lib/components/BottomSheet.svelte'
    import { EmptyState, Group, Row, Segmented, SkeletonList, ToolbarChip } from '$lib/components/premium'
    import { useComparativeDayReport, useComparativeReport } from '../hooks/useComparativeReport'
    import {
        buildMetricComparisons,
        formatCompactRange,
        formatDayDate,
        formatPercent,
        formatPeriodRange,
        headline,
        type ComparablePeriod
    } from '../utils/comparisonModel'
    import { daysInMonthOf } from '../utils/comparativeDay'
    import OptionList from '../components/OptionList.svelte'
    import MetricComparisonCard from '../components/MetricComparisonCard.svelte'

    // Mismos controles que la Comparativa de placepos: modo por periodo / por día.
    const GRANULARITY_OPTIONS = [
        { id: 'weekly', label: 'Semanal' },
        { id: 'biweekly', label: 'Quincenal' },
        { id: 'monthly', label: 'Mensual' },
        { id: 'quarterly', label: 'Trimestral' },
        { id: 'semiannual', label: 'Semestral' },
        { id: 'annual', label: 'Anual' }
    ] as const

    let mode = $state<'periods' | 'by-day'>('periods')
    let granularity = $state<ComparativeGranularity>('monthly')
    let count = $state<'2' | '3'>('2')
    let offset = $state(0)
    let granOpen = $state(false)

    const reference = todayISO()
    const lastDay = daysInMonthOf(reference)
    let day = $state(Number(reference.slice(8, 10)))

    const periodsQuery = useComparativeReport(() => ({ granularity, count: Number(count) as 2 | 3, offset }))
    const dayQuery = useComparativeDayReport(() => ({ reference, day, count: Number(count) as 2 | 3 }))

    const active = $derived(mode === 'periods' ? $periodsQuery : $dayQuery)

    const comparable = $derived.by((): ComparablePeriod[] => {
        if (mode === 'periods') {
            return ($periodsQuery.data?.periods ?? []).map((p) => ({
                label: p.label,
                detail: formatPeriodRange(p.from, p.to),
                sales: p.sales,
                profit: p.profit,
                margin: p.margin,
                growth: p.growth
            }))
        }
        return ($dayQuery.data?.periods ?? []).map((p) => ({
            label: p.label,
            detail: formatDayDate(p.date),
            sales: p.sales,
            profit: p.profit,
            margin: p.margin,
            growth: p.growth
        }))
    })

    const metrics = $derived(buildMetricComparisons(comparable))
    const previousLabel = $derived(comparable.length > 1 ? comparable[comparable.length - 2].label : null)
    const isEmpty = $derived(comparable.length > 0 && comparable.every((p) => p.sales === 0))
    const granLabel = $derived(GRANULARITY_OPTIONS.find((g) => g.id === granularity)?.label ?? 'Periodo')
    const periodsData = $derived($periodsQuery.data)
    const rangeText = $derived(
        periodsData && periodsData.periods.length > 0
            ? formatCompactRange(periodsData.periods[0].from, periodsData.periods[periodsData.periods.length - 1].to)
            : '—'
    )
    const clamped = $derived(($dayQuery.data?.periods ?? []).filter((p) => p.clamped))
    const breakdown = $derived(mode === 'periods' ? (periodsData?.breakdown ?? []) : [])
</script>

<div class="flex flex-col gap-4 px-5 pb-6 pt-2">
    <Segmented
        ariaLabel="Tipo de comparación"
        options={[
            { value: 'periods', label: 'Por periodo' },
            { value: 'by-day', label: 'Por día' }
        ]}
        value={mode}
        onChange={(v) => (mode = v)}
    />

    {#if mode === 'periods'}
        <div class="flex items-center gap-2">
            <ToolbarChip icon={Layers} label={granLabel} onclick={() => (granOpen = true)} ariaLabel="Tamaño del periodo" />
            <Segmented
                class="flex-1"
                ariaLabel="Cantidad de periodos"
                options={[
                    { value: '2', label: '2 periodos' },
                    { value: '3', label: '3 periodos' }
                ]}
                value={count}
                onChange={(v) => (count = v)}
            />
        </div>
        <div class="surface flex items-center gap-1 p-1">
            <button
                type="button"
                aria-label="Periodos anteriores"
                onclick={() => (offset += 1)}
                class="flex h-10 w-10 items-center justify-center rounded-[16px] transition-[background-color,transform] duration-150 active:scale-[0.92] active:bg-foreground/[0.06]"
            >
                <ChevronLeft size={19} strokeWidth={2.2} />
            </button>
            <div class="min-w-0 flex-1 text-center">
                <p class="truncate text-[13.5px] font-semibold tabular-nums text-foreground">{rangeText}</p>
                <p class="text-[11.5px] text-muted-foreground">{offset === 0 ? 'A la fecha' : `${offset} atrás`}</p>
            </div>
            {#if offset > 0}
                <button
                    type="button"
                    onclick={() => (offset = 0)}
                    class="h-8 rounded-full bg-primary/10 px-3 text-[12.5px] font-semibold text-primary transition-transform active:scale-[0.95]"
                >
                    Hoy
                </button>
            {/if}
            <button
                type="button"
                aria-label="Periodos siguientes"
                disabled={!(periodsData?.canGoForward ?? offset > 0)}
                onclick={() => (offset = Math.max(0, offset - 1))}
                class="flex h-10 w-10 items-center justify-center rounded-[16px] transition-[background-color,transform] duration-150 active:scale-[0.92] active:bg-foreground/[0.06] disabled:opacity-30"
            >
                <ChevronRight size={19} strokeWidth={2.2} />
            </button>
        </div>
    {:else}
        <div class="flex items-center gap-2">
            <div class="surface flex flex-1 items-center gap-1 p-1">
                <button
                    type="button"
                    aria-label="Día anterior"
                    disabled={day <= 1}
                    onclick={() => (day = Math.max(1, day - 1))}
                    class="flex h-10 w-10 items-center justify-center rounded-[16px] transition-transform active:scale-[0.92] disabled:opacity-30"
                >
                    <ChevronLeft size={19} strokeWidth={2.2} />
                </button>
                <p class="flex-1 text-center text-[13.5px] font-semibold text-foreground">Día {day} de cada mes</p>
                <button
                    type="button"
                    aria-label="Día siguiente"
                    disabled={day >= lastDay}
                    onclick={() => (day = Math.min(lastDay, day + 1))}
                    class="flex h-10 w-10 items-center justify-center rounded-[16px] transition-transform active:scale-[0.92] disabled:opacity-30"
                >
                    <ChevronRight size={19} strokeWidth={2.2} />
                </button>
            </div>
            <Segmented
                class="w-[132px]"
                ariaLabel="Cantidad de meses"
                options={[
                    { value: '2', label: '2 m' },
                    { value: '3', label: '3 m' }
                ]}
                value={count}
                onChange={(v) => (count = v)}
            />
        </div>
    {/if}

    {#if active.isLoading}
        <SkeletonList rows={4} />
    {:else if active.isError}
        <EmptyState kind="error" title="No se pudo cargar" message={getErrorMessage(active.error)} />
    {:else if comparable.length === 0 || isEmpty}
        <EmptyState
            icon={BarChart3}
            title="Sin ventas para comparar"
            message={mode === 'periods'
                ? 'No hay ventas en ninguno de los periodos. Prueba otro tamaño o retrocede en el tiempo.'
                : `No hubo ventas el día ${day} en ninguno de los meses.`}
        />
    {:else}
        <p class="px-1 text-[13px] text-muted-foreground">
            {mode === 'by-day' ? `Día ${day} · ` : ''}{headline(comparable)}{mode === 'periods' && offset === 0 ? ' · a la fecha' : ''}
        </p>
        <div class="flex flex-col gap-3 transition-opacity duration-200 {active.isFetching ? 'opacity-60' : ''}" aria-busy={active.isFetching}>
            {#each metrics as metric (metric.key)}
                <MetricComparisonCard {metric} {previousLabel} />
            {/each}
        </div>

        {#if clamped.length > 0}
            <p class="px-1 text-[12.5px] text-muted-foreground">
                {clamped.map((p) => p.label).join(', ')}
                {clamped.length === 1 ? 'no tiene' : 'no tienen'} día {day}: se usó su último día.
            </p>
        {/if}

        {#if breakdown.length > 0}
            <Group title="Desglose" caption={`Ventas por sub-periodo · ${comparable[comparable.length - 1].label} frente a ${previousLabel ?? ''}`}>
                {#each breakdown as row (row.label)}
                    {@const latest = row.periods[row.periods.length - 1]}
                    {@const prev = row.periods.length > 1 ? row.periods[row.periods.length - 2] : null}
                    <Row
                        label={row.label}
                        detail={prev ? `Antes ${formatCurrency(prev.sales)}${latest?.growth?.salesPct != null ? ` · ${formatPercent(latest.growth.salesPct)}` : ''}` : undefined}
                        valueText={formatCurrency(latest?.sales ?? 0)}
                    />
                {/each}
            </Group>
        {/if}
    {/if}
</div>

<BottomSheet open={granOpen} title="Tamaño del periodo" onClose={() => (granOpen = false)}>
    <OptionList
        ariaLabel="Tamaño del periodo"
        options={GRANULARITY_OPTIONS}
        value={granularity}
        onChange={(v) => {
            granularity = v as ComparativeGranularity
            offset = 0
            granOpen = false
        }}
    />
</BottomSheet>
