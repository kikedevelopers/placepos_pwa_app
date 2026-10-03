<script lang="ts">
    import { Layers, Store } from '@lucide/svelte'
    import { getErrorMessage } from '$lib/utils/errors'
    import { todayISO } from '$lib/utils/dates'
    import { formatCurrency, formatNumber } from '$lib/utils/numbers'
    import type { BranchDailyClosure } from '$lib/api/requests/reports'
    import CollapsibleSection from '$lib/components/TicketViewer/components/CollapsibleSection.svelte'
    import { useBranchesDailyClosure } from '../hooks/useBranchesDailyClosure'
    import { heroTotalSales } from '../utils/ventasDevengado'
    import ReportState from '../components/ReportState.svelte'
    import DcHeroKpis from '../components/DcHeroKpis.svelte'
    import DcMoneyBlocks from '../components/DcMoneyBlocks.svelte'
    import DcAdjustmentNotes from '../components/DcAdjustmentNotes.svelte'

    const CARD = 'rounded-2xl border border-border bg-card p-5'
    const SHADOW = 'box-shadow:0 8px 14px hsla(222,47%,11%,0.05)'
    const TILE = 'flex flex-col gap-1 rounded-xl border border-border/60 bg-muted/30 p-3'
    const TILE_LABEL = 'text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70'

    const date = todayISO()
    const query = useBranchesDailyClosure(date, true)
    const data = $derived($query.data)

    const branchVenta = (b: BranchDailyClosure): number => heroTotalSales(b.closure)
</script>

<div class="px-5 pb-8 pt-3">
    {#if $query.isLoading}
        <ReportState kind="loading" />
    {:else if $query.isError || !data}
        <ReportState kind="error" message={getErrorMessage($query.error)} />
    {:else}
        <div class="flex flex-col gap-4">
            <!-- ── Total consolidado ── -->
            <div class={CARD} style={SHADOW}>
                <div class="mb-3 flex items-center gap-2.5">
                    <span
                        class="flex h-9 w-9 items-center justify-center rounded-xl"
                        style="background-color:hsla(217,91%,50%,0.15)"
                    >
                        <Layers size={17} color="hsl(217, 91%, 50%)" strokeWidth={2.2} />
                    </span>
                    <div class="min-w-0">
                        <p class="text-sm font-semibold leading-tight text-foreground">
                            Total consolidado
                        </p>
                        <p class="mt-0.5 text-[11px] leading-tight text-muted-foreground">
                            Suma de {data.branches.length}
                            {data.branches.length === 1 ? 'negocio' : 'negocios'} · hoy
                        </p>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-2.5 lg:grid-cols-3">
                    <div class="{TILE} border-primary/30 bg-primary/[0.06]">
                        <span class={TILE_LABEL}>Venta del día</span>
                        <span class="text-lg font-bold tabular-nums text-primary">
                            {formatCurrency(data.totals.salesRevenue)}
                        </span>
                        <span class="text-[10px] tabular-nums text-muted-foreground/70">
                            Margen {formatNumber(data.totals.salesMargin, 1)}%
                        </span>
                    </div>
                    <div class="{TILE} border-primary/30 bg-primary/[0.06]">
                        <span class={TILE_LABEL}>Ganancia del día</span>
                        <span class="text-lg font-bold tabular-nums text-success">
                            {formatCurrency(data.totals.salesProfit)}
                        </span>
                        <span class="text-[10px] tabular-nums text-muted-foreground/70">
                            {formatNumber(data.totals.salesMargin, 1)}% sobre la venta
                        </span>
                    </div>
                    <div class="{TILE} border-primary/30 bg-primary/[0.06]">
                        <span class={TILE_LABEL}>Total recogido</span>
                        <span class="text-lg font-bold tabular-nums text-foreground">
                            {formatCurrency(data.totals.totalCollected)}
                        </span>
                    </div>
                    <div class={TILE}>
                        <span class={TILE_LABEL}>Créditos del día</span>
                        <span class="text-base font-semibold tabular-nums text-foreground">
                            {formatCurrency(data.totals.newCreditsTotal)}
                        </span>
                        <span class="text-[10px] tabular-nums text-muted-foreground/70">
                            {data.totals.newCreditsCount}
                            {data.totals.newCreditsCount === 1 ? 'crédito' : 'créditos'}
                        </span>
                    </div>
                    <div class={TILE}>
                        <span class={TILE_LABEL}>Gastos del día</span>
                        <span class="text-base font-semibold tabular-nums text-destructive">
                            {formatCurrency(data.totals.expensesTotal)}
                        </span>
                    </div>
                    <div class={TILE}>
                        <span class={TILE_LABEL}>Cartera pendiente</span>
                        <span class="text-base font-semibold tabular-nums text-foreground">
                            {formatCurrency(data.totals.pendingCreditsBalance)}
                        </span>
                        <span class="text-[10px] tabular-nums text-muted-foreground/70">
                            {data.totals.pendingCreditsCount}
                            {data.totals.pendingCreditsCount === 1 ? 'crédito' : 'créditos'}
                        </span>
                    </div>
                </div>
            </div>

            <!-- ── Acordeón por sucursal ── -->
            {#each data.branches as branch (branch.companyId)}
                <CollapsibleSection
                    title={branch.name}
                    subtitle={branch.isBranch ? 'Sucursal' : 'Negocio principal'}
                    icon={Store}
                    iconColor={branch.isBranch ? 'hsl(215, 16%, 47%)' : 'hsl(217, 91%, 50%)'}
                    iconBg={branch.isBranch ? 'hsla(215,16%,47%,0.15)' : 'hsla(217,91%,50%,0.15)'}
                >
                    {#snippet trailing()}
                        <span class="flex flex-col items-end leading-tight">
                            <span class="text-[9px] uppercase tracking-wide text-muted-foreground/60">
                                Venta del día
                            </span>
                            <span class="text-sm font-bold tabular-nums text-foreground">
                                {formatCurrency(branchVenta(branch))}
                            </span>
                        </span>
                    {/snippet}

                    <div class="flex flex-col gap-4 pt-1">
                        <DcHeroKpis dc={branch.closure} />
                        <DcMoneyBlocks dc={branch.closure} />
                        <DcAdjustmentNotes dc={branch.closure} />
                    </div>
                </CollapsibleSection>
            {/each}
        </div>
    {/if}
</div>
