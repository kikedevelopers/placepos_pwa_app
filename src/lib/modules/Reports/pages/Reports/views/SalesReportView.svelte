<script lang="ts">
    import { CalendarDays, Receipt, SlidersHorizontal } from '@lucide/svelte'
    import { getErrorMessage } from '$lib/utils/errors'
    import { usePermissions } from '$lib/hooks/usePermissions.svelte'
    import { useDebouncedValue } from '$lib/hooks/useDebouncedValue.svelte'
    import SearchField from '$lib/components/SearchField.svelte'
    import BottomSheet from '$lib/components/BottomSheet.svelte'
    import ToggleSwitch from '$lib/components/ToggleSwitch.svelte'
    import {
        EmptyState,
        Hero,
        Metrics,
        ProgressiveList,
        Segmented,
        Skeleton,
        SkeletonList,
        ToolbarChip,
        groupByDay,
        percent,
        plural,
        toneForAmount,
        type MetricItem
    } from '$lib/components/premium'
    import { useSalesReport } from '../hooks/useSalesReport'
    import { makeRange, rangeCaption, rangeLabel, type DateRangeValue } from '../components/dateRange'
    import DateRangeSheet from '../components/DateRangeSheet.svelte'
    import OptionList from '../components/OptionList.svelte'
    import SaleRow from '../components/SaleRow.svelte'

    type TypeFilter = 'ALL' | 'SALE' | 'ORDER'
    type DocFilter =
        | 'ALL'
        | 'ACTIVE_ONLY'
        | 'WITH_ADJUSTMENTS'
        | 'PARTIAL_VOID'
        | 'FULL_VOID'
        | 'DEBIT_NOTES'
        | 'VOIDED_ONLY'

    const TYPE_OPTIONS = [
        { value: 'ALL', label: 'Todos' },
        { value: 'SALE', label: 'Ventas' },
        { value: 'ORDER', label: 'Pedidos' }
    ] as const

    const DOC_OPTIONS = [
        { id: 'ALL', label: 'Todos los documentos' },
        { id: 'ACTIVE_ONLY', label: 'Solo activos', hint: 'Sin notas ni anulaciones' },
        { id: 'WITH_ADJUSTMENTS', label: 'Con ajustes', hint: 'Facturas con notas crédito o débito' },
        { id: 'PARTIAL_VOID', label: 'Anulación parcial' },
        { id: 'FULL_VOID', label: 'Anulación total' },
        { id: 'DEBIT_NOTES', label: 'Notas débito' },
        { id: 'VOIDED_ONLY', label: 'Eliminados' }
    ] as const

    // Ganancia/margen solo si el usuario puede verlos (paridad placepos).
    const permissions = usePermissions()
    const canViewProfit = $derived(permissions.canViewProfit)

    let range = $state<DateRangeValue>(makeRange('today'))
    let searchInput = $state('')
    let type = $state<TypeFilter>('ALL')
    let docFilter = $state<DocFilter>('ALL')
    let showDeleted = $state(false)
    let rangeOpen = $state(false)
    let filtersOpen = $state(false)
    const debounced = useDebouncedValue(() => searchInput)

    const activeFilters = $derived(
        (type !== 'ALL' ? 1 : 0) + (docFilter !== 'ALL' ? 1 : 0) + (showDeleted ? 1 : 0)
    )

    const query = useSalesReport(() => ({
        dateFrom: range.from,
        dateTo: range.to,
        search: debounced.value || undefined,
        ticketTypes: type === 'ALL' ? undefined : [type],
        noteFilter: docFilter === 'ALL' ? undefined : docFilter,
        showDeleted: showDeleted || undefined
    }))

    const summary = $derived($query.data?.summary)
    const tickets = $derived($query.data?.tickets ?? [])
    const resetKey = $derived(`${range.from}|${range.to}|${debounced.value}|${type}|${docFilter}|${showDeleted}`)

    const metrics = $derived.by((): MetricItem[] => {
        if (!summary) return []
        const items: MetricItem[] = [
            {
                label: 'Ventas',
                text: summary.total_sales_count.toLocaleString('es-CO'),
                hint: summary.total_notes_count
                    ? plural(summary.total_notes_count, 'nota de ajuste', 'notas de ajuste')
                    : 'Sin notas de ajuste'
            },
            {
                label: 'Pedidos por cobrar',
                text: summary.total_orders_count.toLocaleString('es-CO'),
                tone: summary.total_orders_count > 0 ? 'warning' : 'neutral',
                hint: summary.include_orders_in_reports ? 'Incluidos en ingresos' : 'Fuera de ingresos'
            }
        ]
        if (canViewProfit) {
            items.push(
                {
                    label: 'Ganancia',
                    amount: summary.total_profit,
                    tone: toneForAmount(summary.total_profit)
                },
                { label: 'Margen promedio', text: percent(summary.average_margin) }
            )
        }
        return items
    })
</script>

<div class="flex flex-col gap-4 px-5 pb-6 pt-2">
    <div class="flex items-center gap-2">
        <ToolbarChip
            icon={CalendarDays}
            label={range.mode === 'custom' ? rangeCaption(range) : rangeLabel(range)}
            onclick={() => (rangeOpen = true)}
            ariaLabel="Cambiar periodo"
        />
        <ToolbarChip
            icon={SlidersHorizontal}
            label="Filtros"
            count={activeFilters || undefined}
            active={activeFilters > 0}
            onclick={() => (filtersOpen = true)}
        />
    </div>

    {#if $query.isLoading}
        <div class="surface px-5 pb-5 pt-[18px]">
            <Skeleton class="h-3.5 w-28" />
            <Skeleton class="mt-3 h-9 w-44" />
            <Skeleton class="mt-3 h-3.5 w-36" />
        </div>
    {:else if summary}
        <Hero
            label="Ingresos del periodo"
            amount={summary.total_revenue}
            caption={`${rangeCaption(range)} · ${plural(summary.total_sales_count, 'venta')}`}
        />
        <Metrics ariaLabel="Resumen de ventas" items={metrics} />
    {/if}

    <SearchField bind:value={searchInput} placeholder="Buscar cliente o nº de factura" />

    {#if $query.isLoading}
        <SkeletonList rows={6} />
    {:else if $query.isError}
        <EmptyState kind="error" title="No se pudo cargar" message={getErrorMessage($query.error)} />
    {:else if tickets.length === 0}
        <EmptyState
            icon={Receipt}
            title={debounced.value ? 'Sin resultados' : 'Sin ventas en este periodo'}
            message={debounced.value
                ? 'Prueba con otro nombre o número de factura.'
                : 'Cambia el periodo o los filtros para ver más movimientos.'}
        />
    {:else}
        <ProgressiveList items={tickets} {resetKey}>
            {#snippet children(shown)}
                <div class="flex flex-col gap-5">
                    {#each groupByDay(shown, (t) => t.createdAt) as group (group.key)}
                        <section aria-label={group.label}>
                            <h3 class="mb-2 px-1 text-[13px] font-semibold text-muted-foreground">{group.label}</h3>
                            <div class="surface group-rows overflow-hidden">
                                {#each group.items as ticket (`${ticket.rowType}-${ticket.id}`)}
                                    <SaleRow {ticket} {canViewProfit} />
                                {/each}
                            </div>
                        </section>
                    {/each}
                </div>
            {/snippet}
        </ProgressiveList>
    {/if}
</div>

<DateRangeSheet open={rangeOpen} value={range} onClose={() => (rangeOpen = false)} onApply={(v) => (range = v)} />

<BottomSheet open={filtersOpen} title="Filtros" onClose={() => (filtersOpen = false)}>
    <div class="flex flex-col gap-6 pb-1">
        <div class="flex flex-col gap-2">
            <p class="text-[13px] font-semibold text-foreground">Tipo</p>
            <Segmented ariaLabel="Tipo de documento" options={TYPE_OPTIONS} value={type} onChange={(v) => (type = v)} />
        </div>
        <div class="flex flex-col gap-2">
            <p class="text-[13px] font-semibold text-foreground">Documentos</p>
            <OptionList
                ariaLabel="Filtro de documentos"
                options={DOC_OPTIONS}
                value={docFilter}
                onChange={(v) => (docFilter = v as DocFilter)}
            />
        </div>
        <ToggleSwitch
            checked={showDeleted}
            onChange={(v) => (showDeleted = v)}
            label="Mostrar eliminados"
            description="Incluye las ventas anuladas en el listado"
        />
    </div>
</BottomSheet>
