<script lang="ts">
    import { CheckCircle2, Clock, CreditCard as CreditCardIcon, SlidersHorizontal, Wallet } from '@lucide/svelte'
    import type { CreditStatusFilter } from '$lib/api/requests/reports'
    import { formatCurrency } from '$lib/utils/numbers'
    import { getErrorMessage } from '$lib/utils/errors'
    import { useDebouncedValue } from '$lib/hooks/useDebouncedValue.svelte'
    import SearchField from '$lib/components/SearchField.svelte'
    import FilterChips from '$lib/components/FilterChips.svelte'
    import BottomSheet from '$lib/components/BottomSheet.svelte'
    import { useCreditsReport } from '../hooks/useCreditsReport'
    import ToolbarButton from '../components/ToolbarButton.svelte'
    import ReportStatCard from '../components/ReportStatCard.svelte'
    import ReportState from '../components/ReportState.svelte'
    import CreditCard from '../components/CreditCard.svelte'

    // Paridad placepos: por defecto "Pendientes" (créditos que se deben).
    const STATUS_OPTIONS = [
        { id: 'OWED', label: 'Pendientes' },
        { id: 'OVERDUE', label: 'Vencidas' },
        { id: 'PAID', label: 'Pagados' },
        { id: 'ALL', label: 'Todos' }
    ] as const

    const STATUS_LABEL: Record<CreditStatusFilter, string> = {
        OWED: 'Pendientes',
        OVERDUE: 'Vencidas',
        PAID: 'Pagados',
        ALL: 'Todos',
        PENDING: 'Pendiente',
        PARTIALLY_PAID: 'Parcial'
    }

    let status = $state<CreditStatusFilter>('OWED')
    let searchInput = $state('')
    let filtersOpen = $state(false)
    const debounced = useDebouncedValue(() => searchInput)

    const query = useCreditsReport(() => ({
        status,
        search: debounced.value || undefined
    }))

    const summary = $derived($query.data?.summary)
    const credits = $derived($query.data?.credits ?? [])
</script>

<div class="flex flex-col gap-3 px-5 pb-8 pt-3">
    <div class="flex items-center gap-2">
        <ToolbarButton
            icon={SlidersHorizontal}
            label={STATUS_LABEL[status]}
            active={status !== 'OWED'}
            onclick={() => (filtersOpen = true)}
        />
    </div>
    <SearchField bind:value={searchInput} placeholder="Buscar por cliente o nº de ticket" />

    {#if summary}
        <div class="flex flex-col gap-3 pt-1">
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

    {#each credits as credit (credit.id)}
        <CreditCard {credit} />
    {/each}
</div>

<BottomSheet open={filtersOpen} title="Estado del crédito" onClose={() => (filtersOpen = false)}>
    <div class="flex flex-col gap-2 pb-1">
        <FilterChips
            options={STATUS_OPTIONS}
            value={status}
            onChange={(v) => (status = v as CreditStatusFilter)}
        />
    </div>
</BottomSheet>
