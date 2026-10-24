<script lang="ts">
    import { CalendarDays, Users } from '@lucide/svelte'
    import { getErrorMessage } from '$lib/utils/errors'
    import { daysAgoISO, todayISO } from '$lib/utils/dates'
    import { usePermissions } from '$lib/hooks/usePermissions.svelte'
    import { EmptyState, Hero, Metrics, Money, ProgressiveList, Segmented, Skeleton, SkeletonList, ToolbarChip, percent, plural } from '$lib/components/premium'
    import { cn } from '$lib/utils'
    import { useCustomersRfm } from '../hooks/useCustomersRfm'
    import { rangeCaption, type DateRangeValue } from '../components/dateRange'
    import DateRangeSheet from '../components/DateRangeSheet.svelte'
    import { initials } from '../utils/creditRow'
    import { recencyLabel, rfmTotals, sortAndFilterRfm } from '../utils/customersRfm'

    // Por defecto los últimos 90 días (paridad placepos).
    let range = $state<DateRangeValue>({ mode: 'custom', from: daysAgoISO(90), to: todayISO() })
    let rangeOpen = $state(false)
    let filter = $state<'all' | 'overdue'>('all')

    const permissions = usePermissions()
    const query = useCustomersRfm(() => ({ from: range.from, to: range.to }))
    const list = $derived($query.data?.customers ?? [])
    const totals = $derived(rfmTotals(list))
    const customers = $derived(sortAndFilterRfm(list, filter === 'overdue'))
</script>

<div class="flex flex-col gap-4 px-5 pb-6 pt-2">
    <div class="flex items-center gap-2">
        <ToolbarChip icon={CalendarDays} label={rangeCaption(range)} onclick={() => (rangeOpen = true)} ariaLabel="Cambiar periodo" />
    </div>

    {#if $query.isLoading}
        <div class="surface px-5 pb-5 pt-[18px]">
            <Skeleton class="h-3.5 w-28" />
            <Skeleton class="mt-3 h-9 w-44" />
        </div>
        <SkeletonList rows={6} />
    {:else if $query.isError}
        <EmptyState kind="error" title="No se pudo cargar" message={getErrorMessage($query.error)} />
    {:else if list.length === 0}
        <EmptyState icon={Users} title="Sin compras en el periodo" message="Ningún cliente identificado compró en estas fechas." />
    {:else}
        <Hero label="Ventas acumuladas" amount={totals.amount} caption={plural(totals.count, 'cliente')} />
        <Metrics
            ariaLabel="Resumen de clientes"
            items={[
                ...(permissions.canViewProfit
                    ? [{ label: 'Ganancia', amount: totals.profit, tone: (totals.profit >= 0 ? 'positive' : 'negative') as 'positive' | 'negative', hint: `${percent(totals.margin)} de margen` }]
                    : []),
                { label: 'Vencidos', text: totals.overdue.toLocaleString('es-CO'), tone: totals.overdue > 0 ? 'warning' : 'neutral', hint: 'Fuera de su frecuencia' }
            ]}
        />

        <Segmented
            ariaLabel="Clientes a mostrar"
            options={[
                { value: 'all', label: 'Todos' },
                { value: 'overdue', label: `Vencidos (${totals.overdue})` }
            ]}
            value={filter}
            onChange={(v) => (filter = v)}
        />

        {#if customers.length === 0}
            <EmptyState icon={Users} title="Ningún cliente vencido" message="Todos compran dentro de su frecuencia habitual." />
        {:else}
            <ProgressiveList items={customers} resetKey={`${range.from}|${range.to}|${filter}`}>
                {#snippet children(shown)}
                    <div class="surface group-rows overflow-hidden">
                        {#each shown as customer (customer.customerId)}
                            <div class="row flex items-center gap-3 px-4 py-3.5">
                                <span class={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold', customer.overdue ? 'bg-warning/[0.12] text-warning' : 'bg-foreground/[0.06] text-foreground/75')}>
                                    {initials(customer.customerName)}
                                </span>
                                <span class="min-w-0 flex-1">
                                    <span class="block truncate text-[15px] font-medium text-foreground">{customer.customerName}</span>
                                    <span class="mt-0.5 block truncate text-[12.5px] text-muted-foreground">
                                        {#if customer.overdue}<span class="font-medium text-warning">Vencido</span>{' · '}{/if}{recencyLabel(customer.daysSinceLast)}{' · '}{plural(customer.ticketCount, 'compra')}
                                    </span>
                                </span>
                                <span class="flex shrink-0 flex-col items-end">
                                    <Money value={customer.totalAmount} class="text-[15.5px] font-semibold text-foreground" />
                                    {#if permissions.canViewProfit}
                                        <span class="mt-0.5 text-[11.5px] font-medium tabular-nums text-success">{percent(customer.totalMargin)} margen</span>
                                    {/if}
                                </span>
                            </div>
                        {/each}
                    </div>
                {/snippet}
            </ProgressiveList>
        {/if}
    {/if}
</div>

<DateRangeSheet open={rangeOpen} value={range} onClose={() => (rangeOpen = false)} onApply={(v) => (range = v)} />
