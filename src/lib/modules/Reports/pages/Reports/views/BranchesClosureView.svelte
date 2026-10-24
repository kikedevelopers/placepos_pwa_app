<script lang="ts">
    import { ChevronDown, Store } from '@lucide/svelte'
    import { slide } from 'svelte/transition'
    import { cubicOut } from 'svelte/easing'
    import { getErrorMessage } from '$lib/utils/errors'
    import { EmptyState, Hero, Metrics, Money, SkeletonList, percent, plural } from '$lib/components/premium'
    import { useBranchesDailyClosure } from '../hooks/useBranchesDailyClosure'
    import { buildDayBreakdown } from '../utils/buildDayBreakdown'
    import DayBreakdownSections from '../components/DayBreakdownSections.svelte'

    /**
     * "Resumen Sucursales" (espejo de placepos BranchesSummary): total
     * consolidado arriba y, por cada negocio, el MISMO desglose A–E del resumen
     * del día (sin abonos a compras: ese dato no existe por company).
     */
    interface Props {
        date: string
    }
    let { date }: Props = $props()

    const query = useBranchesDailyClosure(() => date, () => true)
    const data = $derived($query.data)
    let openId = $state<number | null>(null)
</script>

<div class="flex flex-col gap-4">
    {#if $query.isLoading}
        <SkeletonList rows={4} />
    {:else if $query.isError || !data}
        <EmptyState kind="error" title="No se pudo cargar" message={getErrorMessage($query.error)} />
    {:else}
        {@const t = data.totals}
        <Hero
            label="Venta del día · consolidado"
            amount={t.salesRevenue}
            caption={`Suma de ${plural(data.branches.length, 'negocio')} · margen ${percent(t.salesMargin)}`}
        />
        <Metrics
            ariaLabel="Totales consolidados"
            items={[
                { label: 'Ganancia del día', amount: t.salesProfit, tone: 'positive', hint: `${percent(t.salesMargin)} sobre la venta` },
                { label: 'Total recogido', amount: t.totalCollected },
                { label: 'Créditos del día', amount: t.newCreditsTotal, hint: plural(t.newCreditsCount, 'crédito') },
                { label: 'Gastos del día', amount: t.expensesTotal, tone: 'negative' },
                { label: 'Cartera pendiente', amount: t.pendingCreditsBalance, tone: 'warning', hint: plural(t.pendingCreditsCount, 'crédito activo', 'créditos activos') },
                { label: 'Saldo final', amount: t.finalTotal }
            ]}
        />

        <h3 class="mt-2 px-1 text-[13px] font-semibold text-muted-foreground">Por negocio</h3>
        {#each data.branches as branch (branch.companyId)}
            {@const expanded = openId === branch.companyId}
            {@const b = buildDayBreakdown(branch.closure, 0)}
            <div class="surface overflow-hidden">
                <button
                    type="button"
                    aria-expanded={expanded}
                    onclick={() => (openId = expanded ? null : branch.companyId)}
                    class="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors duration-100 active:bg-foreground/[0.04]"
                >
                    <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] {branch.isBranch ? 'bg-foreground/[0.06] text-muted-foreground' : 'bg-primary/10 text-primary'}">
                        <Store size={18} strokeWidth={2.1} />
                    </span>
                    <span class="min-w-0 flex-1">
                        <span class="block truncate text-[15px] font-semibold text-foreground">{branch.name}</span>
                        <span class="mt-0.5 block text-[12.5px] text-muted-foreground">
                            {branch.isBranch ? 'Sucursal' : 'Negocio principal'} · Ganancia real
                            <Money value={b.realProfit} class={b.realProfit >= 0 ? 'text-success' : 'text-destructive'} />
                        </span>
                    </span>
                    <span class="flex shrink-0 items-center gap-2">
                        <Money value={b.totalSaleDay} class="text-[15px] font-semibold text-foreground" />
                        <ChevronDown size={17} class="text-muted-foreground transition-transform duration-200 ease-out-strong {expanded ? 'rotate-180' : ''}" />
                    </span>
                </button>
                {#if expanded}
                    <div class="border-t border-border/60 bg-background/60 px-4 py-5" transition:slide={{ duration: 260, easing: cubicOut }}>
                        <DayBreakdownSections {b} hidePurchasePayments />
                    </div>
                {/if}
            </div>
        {/each}
    {/if}
</div>
