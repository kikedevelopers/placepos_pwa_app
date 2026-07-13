<script lang="ts">
    import { CalendarClock, Receipt } from '@lucide/svelte'
    import type { PurchaseDetail } from '$lib/api/requests/purchases'
    import { formatCurrency } from '$lib/utils/numbers'
    import { formatShortDate } from '$lib/utils/dates'
    import { purchaseBalance, purchasePaid } from '../utils/purchaseSummary'

    interface Props {
        purchase: PurchaseDetail
    }
    let { purchase }: Props = $props()

    const paid = $derived(purchasePaid(purchase.credit, purchase.total))
    const balance = $derived(purchaseBalance(purchase.credit))
    const hasBalance = $derived(balance > 0)

    const invoiceLabel = $derived(
        purchase.invoice_date && !Number.isNaN(new Date(purchase.invoice_date).getTime())
            ? formatShortDate(purchase.invoice_date)
            : null
    )
</script>

<div class="rounded-2xl border border-border bg-card p-4">
    <div class="flex items-center justify-between gap-3">
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
        {#if invoiceLabel}
            <span
                class="flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
                style="background-color:hsla(215,16%,47%,0.10)"
                title="Fecha de la factura del proveedor"
            >
                <CalendarClock size={12} />
                Factura {invoiceLabel}
            </span>
        {/if}
    </div>

    <p class="mt-3 text-3xl font-bold tracking-tight tabular-nums text-foreground">
        {formatCurrency(purchase.total)}
    </p>
    <p class="mt-1 text-xs tabular-nums text-muted-foreground">
        Subtotal {formatCurrency(purchase.subtotal)}
        <span class="mx-1.5 text-border">·</span>
        IVA {formatCurrency(purchase.iva_total)}
    </p>

    <div class="mt-4 grid grid-cols-2 gap-3">
        <div
            class="rounded-xl border p-3"
            style="border-color:hsla(158,64%,38%,0.25);background-color:hsla(158,64%,38%,0.06)"
        >
            <p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Abonado
            </p>
            <p
                class="mt-1 text-base font-semibold tabular-nums tracking-tight"
                style="color:hsl(158,64%,34%)"
            >
                {formatCurrency(paid)}
            </p>
        </div>
        <div
            class="rounded-xl border p-3"
            style={hasBalance
                ? 'border-color:hsla(0,84%,55%,0.22);background-color:hsla(0,84%,55%,0.06)'
                : 'border-color:hsla(158,64%,38%,0.25);background-color:hsla(158,64%,38%,0.06)'}
        >
            <p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Saldo
            </p>
            <p
                class="mt-1 text-base font-semibold tabular-nums tracking-tight"
                style={hasBalance ? 'color:hsl(0,74%,48%)' : 'color:hsl(158,64%,34%)'}
            >
                {formatCurrency(balance)}
            </p>
        </div>
    </div>
</div>
