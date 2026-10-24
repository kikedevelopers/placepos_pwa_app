<script lang="ts">
    import { ChevronDown, Crown } from '@lucide/svelte'
    import { slide } from 'svelte/transition'
    import { cubicOut } from 'svelte/easing'
    import type { CashierSummary } from '$lib/api/requests/dashboard'
    import { Money, Row, percent, plural } from '$lib/components/premium'
    import { formatCurrency } from '$lib/utils/numbers'
    import { initials } from '../utils/creditRow'

    /**
     * Un cajero en el ranking del día. Cerrado muestra lo esencial (ventas y
     * total); al tocar despliega el desglose por medio de pago con su ganancia.
     * Los abonos a cartera van APARTE: no suman al total de ventas.
     */
    interface Props {
        cashier: CashierSummary
        rank: number
    }
    let { cashier, rank }: Props = $props()
    let open = $state(false)

    const gain = (profit: number, margin: number) => `Gan. ${formatCurrency(profit)} · ${percent(margin)}`
</script>

<div class="row">
    <button
        type="button"
        aria-expanded={open}
        onclick={() => (open = !open)}
        class="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors duration-100 active:bg-foreground/[0.04]"
    >
        <span class="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground/[0.06] text-[13px] font-semibold text-foreground/75">
            {initials(cashier.userName)}
            {#if rank === 1}
                <span class="absolute -right-1 -top-1 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-warning text-white ring-2 ring-card">
                    <Crown size={10} strokeWidth={2.6} />
                </span>
            {/if}
        </span>
        <span class="min-w-0 flex-1">
            <span class="block truncate text-[15px] font-medium text-foreground">{cashier.userName}</span>
            <span class="mt-0.5 block truncate text-[12.5px] text-muted-foreground">
                #{rank} · {plural(cashier.salesCount, 'venta')} · margen {percent(cashier.margin)}
            </span>
        </span>
        <Money value={cashier.totalSales} class="shrink-0 text-[15.5px] font-semibold text-foreground" />
        <ChevronDown size={16} class="shrink-0 text-muted-foreground transition-transform duration-200 ease-out-strong {open ? 'rotate-180' : ''}" />
    </button>
    {#if open}
        <div class="group-rows mx-4 mb-3 overflow-hidden rounded-[16px] bg-foreground/[0.03]" transition:slide={{ duration: 240, easing: cubicOut }}>
            <Row label="Efectivo" detail={gain(cashier.cashProfit, cashier.cashMargin)} valueText={formatCurrency(cashier.cashSales)} />
            <Row label="Consignación" detail={gain(cashier.transferProfit, cashier.transferMargin)} valueText={formatCurrency(cashier.transferSales)} />
            {#if cashier.creditSales > 0}
                <Row
                    label={cashier.newCredits.count > 0 ? `Crédito (${cashier.newCredits.count})` : 'Crédito'}
                    detail={gain(cashier.creditProfit, cashier.creditMargin)}
                    valueText={formatCurrency(cashier.creditSales)}
                    valueTone="warning"
                />
            {/if}
            <Row label="Ganancia" valueText={formatCurrency(cashier.profit)} valueTone={cashier.profit >= 0 ? 'positive' : 'negative'} emphasis="strong" />
            <Row label="Excedente (reinversión)" valueText={formatCurrency(cashier.surplus)} valueTone={cashier.surplus >= 0 ? 'info' : 'negative'} />
            {#if cashier.creditPaymentsCash > 0}
                <Row label="Abonos a cartera en efectivo" valueText={formatCurrency(cashier.creditPaymentsCash)} level={1} />
            {/if}
            {#if cashier.creditPaymentsTransfer > 0}
                <Row label="Abonos a cartera por consignación" valueText={formatCurrency(cashier.creditPaymentsTransfer)} level={1} />
            {/if}
        </div>
    {/if}
</div>
