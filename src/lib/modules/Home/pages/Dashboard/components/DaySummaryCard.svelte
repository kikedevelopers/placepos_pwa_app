<script lang="ts">
    import { AlertTriangle, BarChart3 } from '@lucide/svelte'
    import { formatCurrency } from '$lib/utils/numbers'
    import { getErrorMessage } from '$lib/utils/errors'
    import { useTodaySummary } from '$lib/hooks/useTodaySummary'
    import Spinner from '$lib/components/Spinner.svelte'
    import SummaryRow from './SummaryRow.svelte'

    const CARD = 'rounded-2xl border border-border bg-card p-5'
    const SHADOW = 'box-shadow:0 8px 14px hsla(222,47%,11%,0.05)'
    const SECTION = 'text-[11px] uppercase tracking-[1px] text-muted-foreground/70 mb-2'

    const query = useTodaySummary()
    const today = $derived($query.data)
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
                    <p class="mt-0.5 text-xs text-muted-foreground">
                        Recaudo, reinversión y ganancia
                    </p>
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

        <SummaryRow label="Ventas en efectivo" value={today.cashSales} tone="asset" />
        <SummaryRow label="Consignaciones" value={today.transferSales} tone="asset" />
        <SummaryRow label="Recaudo de créditos" value={today.creditPaymentsTotal} tone="asset" />
        <SummaryRow label="Abonos en efectivo" value={today.creditPaymentsCash} indent />
        <SummaryRow label="Abonos en consignación" value={today.creditPaymentsTransfer} indent />

        <div
            class="mt-2 flex items-center justify-between rounded-lg px-3 py-2.5"
            style="background-color:hsla(217,91%,50%,0.10);border:1px solid hsla(217,91%,50%,0.30)"
        >
            <span class="text-xs font-semibold text-foreground">Total recaudado</span>
            <span class="text-sm font-bold text-primary">{formatCurrency(today.totalCollected)}</span
            >
        </div>

        <div class="mt-5 border-t border-border/60 pt-4">
            <p class={SECTION}>Reinversión</p>
            <SummaryRow label="Ganancia del día" value={today.profit} tone="liability" />
            <div
                class="mt-2 flex items-center justify-between border-t border-border/60 px-3 py-3"
            >
                <span class="text-xs font-semibold text-foreground">Excedente (reinversión)</span>
                <span class="text-sm font-bold {today.surplus >= 0 ? 'text-info' : 'text-destructive'}"
                    >{formatCurrency(today.surplus)}</span
                >
            </div>
            <p class="mt-2 text-[10px] italic text-muted-foreground/70">
                Costo de los productos vendidos. Se reinvierte para reponer inventario.
            </p>
        </div>

        <div class="mt-5 border-t border-border/60 pt-4">
            <p class={SECTION}>Ganancia real</p>
            <SummaryRow label="Ganancia del día" value={today.profit} tone="asset" />
            <SummaryRow label="Gastos del día" value={today.expenses} tone="liability" />
            <div
                class="mt-2 flex items-center justify-between border-t border-border/60 px-3 py-3"
            >
                <span class="text-xs font-semibold text-foreground">Ganancia real</span>
                <span
                    class="text-base font-bold {today.realProfit >= 0
                        ? 'text-success'
                        : 'text-destructive'}">{formatCurrency(today.realProfit)}</span
                >
            </div>
        </div>

        <div class="mt-5 border-t border-border/60 pt-4">
            <p class={SECTION}>Créditos del día</p>
            <div
                class="flex items-center justify-between rounded-lg px-3 py-2"
                style="background-color:hsla(32,95%,44%,0.10);border:1px solid hsla(32,95%,44%,0.30)"
            >
                <span class="text-xs text-foreground/80">
                    {today.newCredits.count}
                    {today.newCredits.count === 1 ? 'crédito generado' : 'créditos generados'}
                </span>
                <span class="text-sm font-semibold text-warning"
                    >{formatCurrency(today.newCredits.total)}</span
                >
            </div>
            <p class="mt-2 text-[10px] italic text-muted-foreground/70">
                No se incluyen en el ingreso neto (Pasivo: dinero por cobrar).
            </p>
        </div>
    </div>
{/if}
