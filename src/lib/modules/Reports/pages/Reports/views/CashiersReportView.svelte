<script lang="ts">
    import { Banknote, CalendarDays, PiggyBank, TrendingUp, Users } from '@lucide/svelte'
    import { formatCurrency } from '$lib/utils/numbers'
    import { getErrorMessage } from '$lib/utils/errors'
    import { formatShortDate, todayISO } from '$lib/utils/dates'
    import BottomSheet from '$lib/components/BottomSheet.svelte'
    import { useTodayByCashier } from '../hooks/useTodayByCashier'
    import ToolbarButton from '../components/ToolbarButton.svelte'
    import ReportStatCard from '../components/ReportStatCard.svelte'
    import ReportState from '../components/ReportState.svelte'
    import CashierCard from '../components/CashierCard.svelte'

    let date = $state(todayISO())
    let dateOpen = $state(false)

    const query = useTodayByCashier(() => date)
    const data = $derived($query.data)
    const totals = $derived(data?.totals)
    const dateLabel = $derived(date === todayISO() ? 'Hoy' : formatShortDate(date))
</script>

<div class="flex flex-col gap-4 px-5 pb-8 pt-3">
    <div class="flex items-center gap-2">
        <ToolbarButton icon={CalendarDays} label={dateLabel} active onclick={() => (dateOpen = true)} />
    </div>

    {#if data && totals}
        <div class="flex flex-col gap-3">
            <div class="flex gap-3">
                <ReportStatCard
                    icon={Users}
                    tint="primary"
                    label="Cajeros activos"
                    value={String(data.cashiers.length)}
                    description={`${totals.salesCount} ventas`}
                />
                <ReportStatCard
                    icon={Banknote}
                    tint="success"
                    label="Total recaudado"
                    value={formatCurrency(totals.totalCollected)}
                    description="Todos los cajeros"
                />
            </div>
            <div class="flex gap-3">
                <ReportStatCard
                    icon={TrendingUp}
                    tint="violet"
                    label="Ganancia"
                    value={formatCurrency(totals.profit)}
                    description={`${totals.margin.toFixed(1)}% margen`}
                />
                <ReportStatCard
                    icon={PiggyBank}
                    tint="info"
                    label="Excedente"
                    value={formatCurrency(totals.surplus)}
                    description="Reinversión"
                />
            </div>
        </div>
    {/if}

    {#if $query.isLoading}
        <ReportState kind="loading" />
    {:else if $query.isError}
        <ReportState kind="error" message={getErrorMessage($query.error)} />
    {:else if data && data.cashiers.length === 0}
        <ReportState kind="empty" message="No hay ventas por cajero hoy." />
    {/if}

    {#if data && data.cashiers.length > 0}
        <div class="flex flex-col gap-3">
            {#each data.cashiers as cashier, i (cashier.userId)}
                <CashierCard {cashier} rank={i + 1} />
            {/each}
        </div>
    {/if}
</div>

<BottomSheet open={dateOpen} title="Fecha" onClose={() => (dateOpen = false)}>
    <div class="pb-1">
        <input
            type="date"
            value={date}
            max={todayISO()}
            onchange={(e) => {
                date = e.currentTarget.value || todayISO()
                dateOpen = false
            }}
            class="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none"
            aria-label="Fecha del resumen"
        />
    </div>
</BottomSheet>
