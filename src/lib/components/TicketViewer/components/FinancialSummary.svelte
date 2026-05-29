<script lang="ts">
    import { CalendarClock, Receipt, TrendingUp, User } from '@lucide/svelte'
    import type { SaleDetail } from '$lib/api/requests/sales'
    import { formatCurrency } from '$lib/utils/numbers'
    import { formatDateTime } from '$lib/utils/dates'

    interface Props {
        sale: SaleDetail
        canViewProfit: boolean
    }
    let { sale, canViewProfit }: Props = $props()
</script>

<div class="rounded-2xl border border-border bg-card p-4">
    <div class="flex items-center gap-2.5">
        <div
            class="flex h-8 w-8 items-center justify-center rounded-xl"
            style="background-color: hsla(217, 91%, 50%, 0.12)"
        >
            <Receipt size={16} color="hsl(217, 91%, 50%)" strokeWidth={2.2} />
        </div>
        <span class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Resumen financiero
        </span>
    </div>

    <p class="mt-3 text-3xl font-bold tracking-tight tabular-nums text-foreground">
        {formatCurrency(sale.total)}
    </p>

    {#if canViewProfit}
        <div class="mt-4 flex gap-3">
            <div
                class="flex-1 rounded-xl border p-3"
                style="border-color:hsla(158,64%,38%,0.25);background-color:hsla(158,64%,38%,0.06)"
            >
                <div class="flex items-center gap-1">
                    <TrendingUp size={12} color="hsl(158, 64%, 34%)" />
                    <span
                        class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                        >Ganancia</span
                    >
                </div>
                <p
                    class="mt-1 text-base font-semibold tracking-tight tabular-nums"
                    style="color:hsl(158,64%,34%)"
                >
                    {formatCurrency(sale.profit)}
                </p>
            </div>
            <div
                class="flex-1 rounded-xl border p-3"
                style="border-color:hsla(215,16%,47%,0.18);background-color:hsla(215,16%,47%,0.05)"
            >
                <span
                    class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                    >Margen</span
                >
                <p class="mt-1 text-base font-semibold tracking-tight tabular-nums text-foreground">
                    {sale.margin.toFixed(1)}%
                </p>
            </div>
        </div>
    {/if}

    <div class="mt-4 flex flex-col gap-1 border-t border-border/60 pt-3">
        <div class="flex items-center justify-between gap-3 py-1">
            <span class="flex items-center gap-1.5">
                <User size={12} color="hsl(215, 16%, 55%)" strokeWidth={2} />
                <span class="text-xs text-muted-foreground">Registrado por</span>
            </span>
            <span class="flex-1 truncate text-right text-xs font-medium text-foreground"
                >{sale.createdBy || '—'}</span
            >
        </div>
        <div class="flex items-center justify-between gap-3 py-1">
            <span class="flex items-center gap-1.5">
                <CalendarClock size={12} color="hsl(215, 16%, 55%)" strokeWidth={2} />
                <span class="text-xs text-muted-foreground">Fecha y hora</span>
            </span>
            <span class="flex-1 truncate text-right text-xs font-medium text-foreground"
                >{formatDateTime(sale.createdAt)}</span
            >
        </div>
    </div>
</div>
