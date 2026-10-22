<script lang="ts">
    import { formatCurrency } from '$lib/utils/numbers'
    import { creditMarginPct } from '$lib/utils/credits'
    import { getErrorMessage } from '$lib/utils/errors'
    import { useTodaySummary } from '$lib/hooks/useTodaySummary'
    import DashCard from './ui/DashCard.svelte'
    import CardState from './ui/CardState.svelte'
    import MetricRow from './ui/MetricRow.svelte'
    import SalesComposition from './SalesComposition.svelte'
    import { buildSalesComposition } from '../utils/dashboardMath'

    const query = useTodaySummary()
    const today = $derived($query.data)

    const segments = $derived(today ? buildSalesComposition(today) : [])
    // Ganancia y margen DEVENGADOS del crédito del día; los pedidos no son caja.
    // Solo se calcula si hubo crédito; `newCredits` puede faltar (backend viejo).
    const hints = $derived.by(() => {
        if (!today) return {}
        const credits = today.newCredits
        const credit =
            today.creditSales > 0 && credits
                ? `Ganancia ${formatCurrency(credits.profit ?? 0)} · ${creditMarginPct(
                      credits.total ?? 0,
                      credits.profit ?? 0
                  ).toFixed(1)}%`
                : undefined
        return { credit, orders: 'Facturado, aún sin cobrar' }
    })
</script>

{#if $query.isLoading}
    <CardState title="Ventas del día" status="loading" rows={7} />
{:else if $query.isError || !today}
    <CardState
        title="Ventas del día"
        status="error"
        message={getErrorMessage($query.error) ?? 'No se pudo cargar el resumen de ventas del día.'}
        onRetry={() => $query.refetch()}
    />
{:else}
    <DashCard title="Ventas del día" description="Ventas, reinversión y ganancia real">
        {#snippet actions()}
            <span class="inline-flex items-baseline gap-1 rounded-full bg-muted px-2.5 py-1 text-[12px] text-muted-foreground">
                <span class="font-semibold tabular-nums text-foreground">{today.salesCount}</span>
                {today.salesCount === 1 ? 'venta' : 'ventas'}
            </span>
        {/snippet}

        <!-- Total VENTAS del día (DEVENGADO): contado + consignaciones + créditos
             + pedidos. El "Recaudo de cartera" (abonos) vive en Finanzas. -->
        <p class="text-[12.5px] text-muted-foreground">Total ventas</p>
        <p class="mb-4 mt-1 text-[30px] font-semibold leading-none tabular-nums tracking-[-0.03em] text-foreground">
            {formatCurrency(today.totalSales)}
        </p>

        <SalesComposition {segments} {hints} />

        <!-- Ganancia/Excedente DEVENGADOS: incluyen la ganancia del crédito. -->
        <div class="mt-4 border-t border-border/70 pt-4">
            <h3 class="mb-1.5 text-[12.5px] font-semibold text-foreground">Reinversión</h3>
            <dl>
                <MetricRow label="Ganancia del día" value={today.salesProfit} tone="liability" />
                <MetricRow
                    label="Excedente (reinversión)"
                    value={today.salesSurplus}
                    tone={today.salesSurplus >= 0 ? 'info' : 'liability'}
                    result
                />
            </dl>
            <p class="mt-2 text-[11.5px] leading-snug text-muted-foreground">
                Costo de los productos vendidos: se reinvierte para reponer inventario.
            </p>
        </div>

        <div class="mt-4 border-t border-border/70 pt-4">
            <h3 class="mb-1.5 text-[12.5px] font-semibold text-foreground">Ganancia real</h3>
            <dl>
                <MetricRow label="Ganancia del día" value={today.salesProfit} tone="asset" />
                <MetricRow label="Gastos del día" value={today.expenses} tone="liability" />
                <MetricRow
                    label="Ganancia real"
                    value={today.salesRealProfit}
                    tone={today.salesRealProfit >= 0 ? 'asset' : 'liability'}
                    strong
                />
            </dl>
        </div>
    </DashCard>
{/if}
