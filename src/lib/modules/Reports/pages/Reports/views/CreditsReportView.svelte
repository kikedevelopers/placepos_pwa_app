<script lang="ts">
    import { CheckCircle2, Clock, CreditCard as CreditCardIcon, Wallet } from '@lucide/svelte'
    import type { CreditStatus } from '$lib/api/requests/reports'
    import { formatCurrency } from '$lib/utils/numbers'
    import { getErrorMessage } from '$lib/utils/errors'
    import { useDebouncedValue } from '$lib/hooks/useDebouncedValue.svelte'
    import SearchField from '$lib/components/SearchField.svelte'
    import FilterChips from '$lib/components/FilterChips.svelte'
    import { useCreditsReport } from '../hooks/useCreditsReport'
    import { rangeForPreset } from '../components/dateRange'
    import ReportStatCard from '../components/ReportStatCard.svelte'
    import ReportState from '../components/ReportState.svelte'
    import CreditCard from '../components/CreditCard.svelte'

    type StatusFilter = 'ALL' | CreditStatus
    type RangeFilter = 'all' | 'today' | '7d' | 'month'

    const STATUS_OPTIONS = [
        { id: 'ALL', label: 'Todos' },
        { id: 'PENDING', label: 'Pendiente' },
        { id: 'PARTIALLY_PAID', label: 'Parcial' },
        { id: 'PAID', label: 'Pagado' }
    ] as const

    // En créditos el rango es opcional (default "Todo"), igual que placepos.
    const RANGE_OPTIONS = [
        { id: 'all', label: 'Todo' },
        { id: 'today', label: 'Hoy' },
        { id: '7d', label: '7 días' },
        { id: 'month', label: 'Este mes' }
    ] as const

    let status = $state<StatusFilter>('ALL')
    let range = $state<RangeFilter>('all')
    let searchInput = $state('')
    const debounced = useDebouncedValue(() => searchInput)

    const query = useCreditsReport(() => {
        const dates = range === 'all' ? {} : rangeForPreset(range)
        return {
            ...dates,
            status: status === 'ALL' ? undefined : status,
            search: debounced.value || undefined
        }
    })

    const summary = $derived($query.data?.summary)
    const credits = $derived($query.data?.credits ?? [])
</script>

<div class="flex flex-col gap-3 px-5 pb-8 pt-3">
    <div class="flex flex-col gap-4 pb-3">
        <div class="flex flex-col gap-3">
            <FilterChips options={RANGE_OPTIONS} value={range} onChange={(v) => (range = v as RangeFilter)} />
            <FilterChips options={STATUS_OPTIONS} value={status} onChange={(v) => (status = v as StatusFilter)} />
            <SearchField bind:value={searchInput} placeholder="Buscar por cliente o nº de ticket" />
        </div>

        {#if summary}
            <div class="flex flex-col gap-3">
                <div class="flex gap-3">
                    <ReportStatCard
                        icon={CreditCardIcon}
                        tint="primary"
                        label="Total créditos"
                        value={String(summary.total_credits_count)}
                        description={`${summary.pending_count} pend · ${summary.partial_count} parcial`}
                    />
                    <ReportStatCard
                        icon={Wallet}
                        tint="warning"
                        label="Monto total"
                        value={formatCurrency(summary.total_amount)}
                        description="Suma de créditos"
                    />
                </div>
                <div class="flex gap-3">
                    <ReportStatCard
                        icon={CheckCircle2}
                        tint="success"
                        label="Total abonado"
                        value={formatCurrency(summary.total_paid)}
                        description={`${summary.paid_count} pagado(s)`}
                    />
                    <ReportStatCard
                        icon={Clock}
                        tint="destructive"
                        label="Saldo pendiente"
                        value={formatCurrency(summary.total_balance)}
                        description="Por cobrar"
                    />
                </div>
            </div>
        {/if}

        {#if $query.isLoading}
            <ReportState kind="loading" />
        {:else if $query.isError}
            <ReportState kind="error" message={getErrorMessage($query.error)} />
        {:else if credits.length === 0}
            <ReportState kind="empty" message="No hay créditos para el filtro seleccionado." />
        {/if}
    </div>

    {#each credits as credit (credit.id)}
        <CreditCard {credit} />
    {/each}
</div>
