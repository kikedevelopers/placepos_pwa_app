<script lang="ts">
    import { Clock, DollarSign, Eye, EyeOff, Receipt, TrendingUp } from '@lucide/svelte'
    import { formatCurrency } from '$lib/utils/numbers'
    import { getErrorMessage } from '$lib/utils/errors'
    import { useDebouncedValue } from '$lib/hooks/useDebouncedValue.svelte'
    import SearchField from '$lib/components/SearchField.svelte'
    import FilterChips from '$lib/components/FilterChips.svelte'
    import { useSalesReport } from '../hooks/useSalesReport'
    import DateRangeChips from '../components/DateRangeChips.svelte'
    import { rangeForPreset, type RangePreset } from '../components/dateRange'
    import ReportStatCard from '../components/ReportStatCard.svelte'
    import ReportState from '../components/ReportState.svelte'
    import SaleTicketCard from '../components/SaleTicketCard.svelte'

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
        { id: 'ALL', label: 'Todos' },
        { id: 'SALE', label: 'Ventas' },
        { id: 'ORDER', label: 'Pedidos' }
    ] as const

    const DOC_OPTIONS = [
        { id: 'ALL', label: 'Todos' },
        { id: 'ACTIVE_ONLY', label: 'Solo activos' },
        { id: 'WITH_ADJUSTMENTS', label: 'Con ajustes' },
        { id: 'PARTIAL_VOID', label: 'Anulación parcial' },
        { id: 'FULL_VOID', label: 'Anulación total' },
        { id: 'DEBIT_NOTES', label: 'Notas débito' },
        { id: 'VOIDED_ONLY', label: 'Eliminados' }
    ] as const

    let preset = $state<RangePreset>('today')
    let searchInput = $state('')
    let type = $state<TypeFilter>('ALL')
    let docFilter = $state<DocFilter>('ALL')
    let showDeleted = $state(false)
    const debounced = useDebouncedValue(() => searchInput)

    const query = useSalesReport(() => {
        const range = rangeForPreset(preset)
        return {
            ...range,
            search: debounced.value || undefined,
            ticketTypes: type === 'ALL' ? undefined : [type],
            noteFilter: docFilter === 'ALL' ? undefined : docFilter,
            showDeleted: showDeleted || undefined
        }
    })

    const summary = $derived($query.data?.summary)
    const tickets = $derived($query.data?.tickets ?? [])
</script>

<div class="flex flex-col gap-3 px-5 pb-8 pt-3">
    <div class="flex flex-col gap-4 pb-3">
        <div class="flex flex-col gap-3">
            <DateRangeChips value={preset} onChange={(p) => (preset = p)} />
            <SearchField bind:value={searchInput} placeholder="Buscar por cliente o nº de factura" />
        </div>

        <div class="flex flex-col gap-2">
            <p class="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Tipo
            </p>
            <FilterChips options={TYPE_OPTIONS} value={type} onChange={(v) => (type = v as TypeFilter)} />
        </div>

        <div class="flex flex-col gap-2">
            <p class="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Documentos
            </p>
            <FilterChips
                options={DOC_OPTIONS}
                value={docFilter}
                onChange={(v) => (docFilter = v as DocFilter)}
            />
            <button
                type="button"
                onclick={() => (showDeleted = !showDeleted)}
                class="flex w-fit items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-opacity active:opacity-80 {showDeleted
                    ? 'border-transparent text-white'
                    : 'border-border bg-card text-muted-foreground'}"
                style={showDeleted ? 'background-color: hsl(217, 91%, 50%)' : ''}
            >
                {#if showDeleted}
                    <Eye size={13} color="white" />
                {:else}
                    <EyeOff size={13} color="hsl(215, 16%, 47%)" />
                {/if}
                Mostrar eliminados
            </button>
        </div>

        {#if summary}
            <div class="flex flex-col gap-3">
                <div class="flex gap-3">
                    <ReportStatCard
                        icon={Receipt}
                        tint="success"
                        label="Ventas registradas"
                        value={String(summary.total_sales_count)}
                        description={summary.total_notes_count
                            ? `${summary.total_notes_count} nota(s) de ajuste`
                            : 'Sin notas de ajuste'}
                    />
                    <ReportStatCard
                        icon={DollarSign}
                        tint="primary"
                        label="Ingresos totales"
                        value={formatCurrency(summary.total_revenue)}
                        description="Consolidado"
                    />
                </div>
                <div class="flex gap-3">
                    <ReportStatCard
                        icon={Clock}
                        tint="warning"
                        label="Pedidos pendientes"
                        value={String(summary.total_orders_count)}
                        description="Sin cobrar"
                    />
                    <ReportStatCard
                        icon={TrendingUp}
                        tint="violet"
                        label="Ganancia"
                        value={formatCurrency(summary.total_profit)}
                        description={`Margen: ${summary.average_margin.toFixed(1)}%`}
                    />
                </div>
            </div>
        {/if}

        {#if $query.isLoading}
            <ReportState kind="loading" />
        {:else if $query.isError}
            <ReportState kind="error" message={getErrorMessage($query.error)} />
        {:else if tickets.length === 0}
            <ReportState kind="empty" message="No hay ventas en el periodo seleccionado." />
        {/if}
    </div>

    {#each tickets as ticket (`${ticket.rowType}-${ticket.id}`)}
        <SaleTicketCard {ticket} />
    {/each}
</div>
