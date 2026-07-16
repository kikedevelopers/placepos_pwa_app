<script lang="ts">
    import { Crown } from '@lucide/svelte'
    import type { CashierSummary } from '$lib/api/requests/dashboard'
    import { formatCurrency } from '$lib/utils/numbers'
    import LineRow from './LineRow.svelte'
    import Badge from './Badge.svelte'

    interface Props {
        cashier: CashierSummary
        rank: number
    }
    let { cashier, rank }: Props = $props()

    // Ganancia y margen del método, como sub-línea del desglose.
    const profitHint = (profit: number, margin: number): string =>
        `Gan. ${formatCurrency(profit)} · ${margin.toFixed(1)}%`

    const initialsOf = (name: string): string => {
        const parts = name.trim().split(/\s+/).filter(Boolean)
        return (
            parts
                .slice(0, 2)
                .map((w) => w[0]?.toUpperCase() ?? '')
                .join('') || '?'
        )
    }

    const top = $derived(rank === 1)
</script>

<div
    class="rounded-2xl border border-border bg-card p-4"
    style="box-shadow:0 6px 12px hsla(222,47%,11%,0.05)"
>
    <div class="flex items-center gap-3">
        <div
            class="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold {top
                ? 'text-warning'
                : 'text-primary'}"
            style="background-color: {top
                ? 'hsla(32, 95%, 44%, 0.15)'
                : 'hsla(217, 91%, 50%, 0.12)'}"
        >
            {initialsOf(cashier.userName)}
        </div>
        <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-semibold text-foreground">{cashier.userName}</p>
            <p class="text-[11px] text-muted-foreground">
                {cashier.salesCount} venta(s) emitida(s)
            </p>
        </div>
        <div class="flex items-center gap-1">
            {#if top}
                <Crown size={14} color="hsl(32, 95%, 44%)" />
            {/if}
            <Badge label={`#${rank}`} tone={top ? 'warning' : 'muted'} />
        </div>
    </div>

    <div class="mt-3 border-t border-border/60 pt-3">
        <p class="text-[11px] text-muted-foreground">Total Ventas</p>
        <p class="truncate text-xl font-bold text-foreground">
            {formatCurrency(cashier.totalSales)}
        </p>
    </div>

    <div class="mt-3 flex gap-3">
        <div class="flex-1 rounded-xl border border-border bg-secondary/40 p-3">
            <p class="text-[11px] text-muted-foreground">Ganancia</p>
            <p
                class="text-sm font-bold {cashier.profit >= 0
                    ? 'text-success'
                    : 'text-destructive'}"
            >
                {formatCurrency(cashier.profit)}
            </p>
            <p class="mt-0.5 text-[10px] text-muted-foreground/70">
                {cashier.margin.toFixed(1)}% margen
            </p>
        </div>
        <div class="flex-1 rounded-xl border border-border bg-secondary/40 p-3">
            <p class="text-[11px] text-muted-foreground">Excedente</p>
            <p
                class="text-sm font-bold {cashier.surplus >= 0 ? 'text-info' : 'text-destructive'}"
            >
                {formatCurrency(cashier.surplus)}
            </p>
            <p class="mt-0.5 text-[10px] text-muted-foreground/70">Reinversión</p>
        </div>
    </div>

    <div class="mt-3 border-t border-border/60 pt-2">
        <p class="mb-1 text-[11px] uppercase tracking-[1px] text-muted-foreground/70">Desglose</p>
        <!-- Total Ventas del cajero = Efectivo + Consignación + Crédito (DEVENGADO,
             el crédito es una venta más). Cada método muestra su ganancia/margen.
             Los abonos (Recaudo de Cartera) quedan APARTE, no suman al total. -->
        <LineRow
            label="Efectivo"
            value={formatCurrency(cashier.cashSales)}
            tone="asset"
            hint={profitHint(cashier.cashProfit, cashier.cashMargin)}
        />
        <LineRow
            label="Consignación"
            value={formatCurrency(cashier.transferSales)}
            tone="info"
            hint={profitHint(cashier.transferProfit, cashier.transferMargin)}
        />
        {#if cashier.creditSales > 0}
            <LineRow
                label={cashier.newCredits.count > 0
                    ? `Crédito (${cashier.newCredits.count})`
                    : 'Crédito'}
                value={formatCurrency(cashier.creditSales)}
                tone="warning"
                hint={profitHint(cashier.creditProfit, cashier.creditMargin)}
            />
        {/if}
        {#if cashier.creditPaymentsCash > 0}
            <LineRow
                label="Abonos en efectivo"
                value={formatCurrency(cashier.creditPaymentsCash)}
                indent
            />
        {/if}
        {#if cashier.creditPaymentsTransfer > 0}
            <LineRow
                label="Abonos por consignación"
                value={formatCurrency(cashier.creditPaymentsTransfer)}
                indent
            />
        {/if}
    </div>
</div>
