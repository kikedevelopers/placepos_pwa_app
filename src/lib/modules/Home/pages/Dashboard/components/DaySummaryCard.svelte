<script lang="ts">
    import { AlertTriangle, BarChart3 } from '@lucide/svelte'
    import { formatCurrency } from '$lib/utils/numbers'
    import { creditMarginPct } from '$lib/utils/credits'
    import { getErrorMessage } from '$lib/utils/errors'
    import { useTodaySummary } from '$lib/hooks/useTodaySummary'
    import Spinner from '$lib/components/Spinner.svelte'
    import SummaryRow from './SummaryRow.svelte'

    const CARD = 'rounded-2xl border border-border bg-card p-5'
    const SHADOW = 'box-shadow:0 8px 14px hsla(222,47%,11%,0.05)'
    const SECTION = 'text-[11px] uppercase tracking-[1px] text-muted-foreground/70 mb-2'

    const query = useTodaySummary()
    const today = $derived($query.data)

    // Hint de la fila "Créditos del día": ganancia y margen DEVENGADOS del crédito.
    const creditHint = $derived(
        today
            ? `Ganancia ${formatCurrency(today.newCredits.profit)} · ${creditMarginPct(
                  today.newCredits.total,
                  today.newCredits.profit
              ).toFixed(1)}%`
            : ''
    )
</script>

{#if $query.isLoading}
    <div class="{CARD} flex min-h-[200px] items-center justify-center" style={SHADOW}>
        <Spinner />
    </div>
{:else if $query.isError || !today}
    <div class="{CARD} flex items-center gap-3" style={SHADOW}>
        <AlertTriangle size={18} color="hsl(32, 95%, 44%)" strokeWidth={2} />
        <p class="flex-1 text-xs leading-4 text-muted-foreground">
            {getErrorMessage($query.error) ?? 'No se pudo cargar el resumen de ventas del día.'}
        </p>
    </div>
{:else}
    <div class={CARD} style={SHADOW}>
        <div class="mb-4 flex items-center justify-between gap-3">
            <div class="flex flex-1 items-center gap-2.5">
                <div
                    class="flex h-9 w-9 items-center justify-center rounded-xl"
                    style="background-color: hsla(217, 91%, 50%, 0.15)"
                >
                    <BarChart3 size={16} color="hsl(217, 91%, 50%)" strokeWidth={2} />
                </div>
                <div class="flex-1">
                    <p class="text-sm font-semibold text-foreground">Resumen de ventas del día</p>
                    <p class="mt-0.5 text-xs text-muted-foreground">Ventas y ganancia del día</p>
                </div>
            </div>
            <div
                class="rounded-full px-2.5 py-1"
                style="background-color: hsla(217, 91%, 50%, 0.10)"
            >
                <span class="text-[11px] font-semibold text-primary">
                    {today.salesCount}
                    {today.salesCount === 1 ? 'venta' : 'ventas'}
                </span>
            </div>
        </div>

        <!-- Bloque VENTAS del día (DEVENGADO): contado + consignaciones + CRÉDITOS
             del día (una venta a crédito es una venta más, discriminada con su
             ganancia) + pedidos. El "Recaudo de cartera" (abonos) es algo
             COMPLETAMENTE APARTE: no se muestra aquí, vive en Finanzas. -->
        <SummaryRow label="Ventas en efectivo" value={today.cashSales} tone="asset" />
        <SummaryRow label="Consignaciones" value={today.transferSales} tone="asset" />
        {#if today.creditSales > 0}
            <SummaryRow
                label="Créditos del día"
                value={today.creditSales}
                tone="asset"
                hint={creditHint}
            />
        {/if}
        {#if today.ordersTotal > 0}
            <SummaryRow
                label="Pedidos (facturación)"
                value={today.ordersTotal}
                tone="asset"
                hint="Facturado, aún sin cobrar"
            />
        {/if}

        <div
            class="mt-2 flex items-center justify-between rounded-lg px-3 py-2.5"
            style="background-color:hsla(217,91%,50%,0.10);border:1px solid hsla(217,91%,50%,0.30)"
        >
            <span class="text-xs font-semibold text-foreground">Total Ventas del día</span>
            <span class="text-sm font-bold text-primary">{formatCurrency(today.totalSales)}</span>
        </div>

        <div class="mt-5 border-t border-border/60 pt-4">
            <p class={SECTION}>Reinversión</p>
            <!-- Ganancia/Excedente DEVENGADOS: incluyen la ganancia del crédito. -->
            <SummaryRow label="Ganancia del día" value={today.salesProfit} tone="liability" />
            <div
                class="mt-2 flex items-center justify-between border-t border-border/60 px-3 py-3"
            >
                <span class="text-xs font-semibold text-foreground">Excedente (reinversión)</span>
                <span
                    class="text-sm font-bold {today.salesSurplus >= 0
                        ? 'text-info'
                        : 'text-destructive'}">{formatCurrency(today.salesSurplus)}</span
                >
            </div>
            <p class="mt-2 text-[10px] italic text-muted-foreground/70">
                Costo de los productos vendidos. Se reinvierte para reponer inventario.
            </p>
        </div>

        <div class="mt-5 border-t border-border/60 pt-4">
            <p class={SECTION}>Ganancia real</p>
            <SummaryRow label="Ganancia del día" value={today.salesProfit} tone="asset" />
            <SummaryRow label="Gastos del día" value={today.expenses} tone="liability" />
            <div
                class="mt-2 flex items-center justify-between border-t border-border/60 px-3 py-3"
            >
                <span class="text-xs font-semibold text-foreground">Ganancia real</span>
                <span
                    class="text-base font-bold {today.salesRealProfit >= 0
                        ? 'text-success'
                        : 'text-destructive'}">{formatCurrency(today.salesRealProfit)}</span
                >
            </div>
        </div>
    </div>
{/if}
