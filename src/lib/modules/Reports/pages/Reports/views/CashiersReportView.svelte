<script lang="ts">
    import { UsersRound } from '@lucide/svelte'
    import { getErrorMessage } from '$lib/utils/errors'
    import { todayISO } from '$lib/utils/dates'
    import { EmptyState, Hero, Metrics, Skeleton, SkeletonList, percent, plural } from '$lib/components/premium'
    import { useTodayByCashier } from '../hooks/useTodayByCashier'
    import DayChip from '../components/DayChip.svelte'
    import CashierRow from '../components/CashierRow.svelte'

    let date = $state(todayISO())
    const query = useTodayByCashier(() => date)
    const data = $derived($query.data)
    const totals = $derived(data?.totals)
</script>

<div class="flex flex-col gap-4 px-5 pb-6 pt-2">
    <div class="flex items-center gap-2">
        <DayChip value={date} onChange={(v) => (date = v)} />
    </div>

    {#if $query.isLoading}
        <div class="surface px-5 pb-5 pt-[18px]">
            <Skeleton class="h-3.5 w-28" />
            <Skeleton class="mt-3 h-9 w-44" />
        </div>
        <SkeletonList rows={4} />
    {:else if $query.isError}
        <EmptyState kind="error" title="No se pudo cargar" message={getErrorMessage($query.error)} />
    {:else if data && totals}
        <Hero
            label="Ventas de todos los cajeros"
            amount={totals.totalSales}
            caption={`${plural(data.cashiers.length, 'cajero')} · ${plural(totals.salesCount, 'venta')}`}
        />
        <Metrics
            ariaLabel="Totales del día"
            items={[
                { label: 'Ganancia', amount: totals.profit, tone: totals.profit > 0 ? 'positive' : totals.profit < 0 ? 'negative' : 'neutral', hint: `${percent(totals.margin)} de margen` },
                { label: 'Excedente', amount: totals.surplus, hint: 'Reinversión' }
            ]}
        />
        {#if data.cashiers.length === 0}
            <EmptyState icon={UsersRound} title="Sin ventas este día" message="Ningún cajero registró ventas en la fecha elegida." />
        {:else}
            <section aria-label="Ranking de cajeros">
                <h3 class="mb-2 px-1 text-[13px] font-semibold text-muted-foreground">Ranking del día</h3>
                <div class="surface group-rows overflow-hidden">
                    {#each data.cashiers as cashier, i (cashier.userId)}
                        <CashierRow {cashier} rank={i + 1} />
                    {/each}
                </div>
            </section>
        {/if}
    {/if}
</div>
