<script lang="ts">
    import { CalendarDays, TrendingUp, Users, Wallet } from '@lucide/svelte'
    import { formatCurrency } from '$lib/utils/numbers'
    import { getErrorMessage } from '$lib/utils/errors'
    import { daysAgoISO, todayISO } from '$lib/utils/dates'
    import type { CustomerRfm } from '$lib/api/requests/reports'
    import { useCustomersRfm } from '../hooks/useCustomersRfm'
    import { rangeLabel, type DateRangeValue } from '../components/dateRange'
    import DateRangeSheet from '../components/DateRangeSheet.svelte'
    import ToolbarButton from '../components/ToolbarButton.svelte'
    import ReportStatCard from '../components/ReportStatCard.svelte'
    import ReportState from '../components/ReportState.svelte'
    import Badge from '../components/Badge.svelte'

    // Default: últimos 90 días (paridad placepos). Modo custom para que el sheet
    // muestre el rango manual; el usuario puede cambiar a cualquier preset.
    let range = $state<DateRangeValue>({ mode: 'custom', from: daysAgoISO(90), to: todayISO() })
    let rangeOpen = $state(false)

    const query = useCustomersRfm(() => ({ from: range.from, to: range.to }))
    // Top spenders primero (Monetary desc).
    const customers = $derived(
        [...($query.data?.customers ?? [])].sort((a, b) => b.totalAmount - a.totalAmount)
    )

    const totals = $derived.by(() => {
        const list = $query.data?.customers ?? []
        const amount = list.reduce((s, c) => s + c.totalAmount, 0)
        const profit = list.reduce((s, c) => s + c.totalProfit, 0)
        return {
            count: list.length,
            amount,
            profit,
            margin: amount > 0 ? (profit / amount) * 100 : 0,
            overdue: list.filter((c) => c.overdue).length
        }
    })

    const recency = (c: CustomerRfm): string =>
        c.daysSinceLast <= 0 ? 'Hoy' : `Hace ${c.daysSinceLast} día${c.daysSinceLast === 1 ? '' : 's'}`
</script>

<div class="flex flex-col gap-3 px-5 pb-8 pt-3">
    <div class="flex items-center gap-2">
        <ToolbarButton icon={CalendarDays} label={rangeLabel(range)} active onclick={() => (rangeOpen = true)} />
    </div>

    {#if totals.count > 0}
        <div class="flex flex-col gap-3 pt-1">
            <div class="flex gap-3">
                <ReportStatCard
                    icon={Users}
                    tint="primary"
                    label="Clientes"
                    value={String(totals.count)}
                    description={totals.overdue ? `${totals.overdue} con mora` : 'Sin mora'}
                />
                <ReportStatCard
                    icon={Wallet}
                    tint="success"
                    label="Monto total"
                    value={formatCurrency(totals.amount)}
                    description="Compras del periodo"
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
                    icon={Users}
                    tint="warning"
                    label="Con mora"
                    value={String(totals.overdue)}
                    description="Créditos vencidos"
                />
            </div>
        </div>
    {/if}

    {#if $query.isLoading}
        <ReportState kind="loading" />
    {:else if $query.isError}
        <ReportState kind="error" message={getErrorMessage($query.error)} />
    {:else if customers.length === 0}
        <ReportState kind="empty" message="No hay clientes con compras en el periodo." />
    {/if}

    {#each customers as c (c.customerId)}
        <div
            class="rounded-2xl border border-border bg-card p-4"
            style="box-shadow:0 4px 10px hsla(222,47%,11%,0.04)"
        >
            <div class="mb-2 flex items-center justify-between gap-2">
                <p class="truncate text-sm font-semibold text-foreground">{c.customerName}</p>
                <span class="flex shrink-0 items-center gap-1.5">
                    {#if c.overdue}
                        <Badge label="Mora" tone="destructive" />
                    {/if}
                    <span class="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        {recency(c)}
                    </span>
                </span>
            </div>

            <div class="grid grid-cols-3 gap-2 border-t border-border/60 pt-2">
                <div>
                    <p class="text-[10px] text-muted-foreground">Compras</p>
                    <p class="text-sm font-bold text-foreground">{c.ticketCount}</p>
                    <p class="text-[10px] text-muted-foreground/70">{c.purchaseDates} día(s)</p>
                </div>
                <div>
                    <p class="text-[10px] text-muted-foreground">Gastado</p>
                    <p class="text-sm font-bold text-foreground">{formatCurrency(c.totalAmount)}</p>
                </div>
                <div>
                    <p class="text-[10px] text-muted-foreground">Ganancia</p>
                    <p class="text-sm font-bold text-success">{formatCurrency(c.totalProfit)}</p>
                    <p class="text-[10px] text-muted-foreground/70">{c.totalMargin.toFixed(1)}%</p>
                </div>
            </div>
        </div>
    {/each}
</div>

<DateRangeSheet
    open={rangeOpen}
    value={range}
    onClose={() => (rangeOpen = false)}
    onApply={(v) => (range = v)}
/>
