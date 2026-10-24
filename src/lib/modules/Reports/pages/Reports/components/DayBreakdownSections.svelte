<script lang="ts">
    import type { BankDetail } from '$lib/api/requests/reports/types'
    import { Group, Pill, Row, percent } from '$lib/components/premium'
    import { formatCurrency } from '$lib/utils/numbers'
    import type { DayBreakdown } from '../utils/buildDayBreakdown'

    /**
     * Secciones A–E del "Resumen del día": espejo EXACTO de
     * ClosureBreakdownSections de placepos (mismas etiquetas, mismo orden, mismas
     * condiciones para mostrar u ocultar filas). Solo pinta un DayBreakdown.
     */
    interface Props {
        b: DayBreakdown
        /** En el resumen por sucursal no hay abonos a compras por company. */
        hidePurchasePayments?: boolean
    }
    let { b, hidePurchasePayments = false }: Props = $props()

    const money = (v: number) => formatCurrency(v)
    const minus = (v: number) => (v > 0 ? `− ${formatCurrency(v)}` : formatCurrency(v))
    const gain = (profit: number, margin: number) => `Gan. ${formatCurrency(profit)} · ${percent(margin)}`

    const hasConsignCollection = $derived(
        b.consignCollectFlat > 0 ||
            b.consignCollectTodayDetail.length > 0 ||
            b.consignCollectPreviousDetail.length > 0
    )
</script>

{#snippet banks(details: BankDetail[], base: string)}
    {#each details as d (d.bankName)}
        <Row label={`${base} — ${d.bankName || 'Sin especificar'}`} valueText={money(d.amount)} level={1} />
    {/each}
{/snippet}

{#snippet sublabel(text: string)}
    <div class="row px-4 pb-1 pt-3 text-[11.5px] font-semibold uppercase tracking-[0.04em] text-muted-foreground/80">
        {text}
    </div>
{/snippet}

<div class="flex flex-col gap-6">
    <!-- A. EFECTIVO RECAUDADO -->
    <Group title="Efectivo recaudado" caption="Dinero en efectivo que entró hoy">
        <Row label="Venta en efectivo" valueText={money(b.cashSale)} />
        {#if b.hasAge}
            <Row label="Recaudo de créditos del día" valueText={money(b.cashCollectToday)} level={1} />
            <Row label="Recaudo de créditos de días anteriores" valueText={money(b.cashCollectPrevious)} level={1} />
        {:else}
            <Row label="Recaudo de créditos en efectivo" valueText={money(b.cashCollectFlat)} level={1} />
        {/if}
        <Row label="Total efectivo recaudado" valueText={money(b.totalCashCollected)} emphasis="total" />
    </Group>

    <!-- B. CONSIGNACIONES RECAUDADAS -->
    <Group title="Consignaciones recaudadas" caption="Dinero por consignación que entró hoy">
        <Row label="Venta por consignación" valueText={money(b.consignSale)} />
        {@render banks(b.consignSaleDetail, 'Consignación')}
        {#if hasConsignCollection}
            {@render sublabel('Recaudo de créditos por consignación')}
            {#if b.hasAge}
                {#if b.consignCollectTodayDetail.length > 0}
                    {@render sublabel('Del día')}
                    {@render banks(b.consignCollectTodayDetail, 'Abono')}
                {/if}
                {#if b.consignCollectPreviousDetail.length > 0}
                    {@render sublabel('Días anteriores')}
                    {@render banks(b.consignCollectPreviousDetail, 'Abono')}
                {/if}
            {:else}
                {@render banks(b.consignCollectFlatDetail, 'Abono')}
            {/if}
        {/if}
        <Row label="Total consignaciones recaudado" valueText={money(b.totalConsignCollected)} emphasis="total" />
    </Group>

    <!-- Cierre del dinero recogido -->
    <div class="surface flex items-center justify-between gap-3 bg-primary/[0.06] px-4 py-4">
        <span class="text-[15px] font-semibold text-primary">Total recogido en el día</span>
        <span class="text-[17px] font-bold tabular-nums text-primary">{money(b.totalCollected)}</span>
    </div>

    <!-- C. VENTA DEL DÍA -->
    <Group title="Venta del día" caption="Lo vendido hoy (contado + crédito), con su ganancia">
        <Row label="Venta del día en efectivo" valueText={money(b.saleCash)} />
        <Row label="Venta del día en consignación" valueText={money(b.saleConsign)} />
        {#if b.saleOrders > 0}
            <Row label="Pedidos (facturación)" valueText={money(b.saleOrders)} />
        {/if}
        {#if b.hasCredit}
            <Row
                label="Total venta de contado"
                detail={gain(b.directProfit, b.directMargin)}
                valueText={money(b.directTotal)}
                emphasis="strong"
            />
            <Row
                label="Venta a crédito del día"
                detail={gain(b.saleCreditProfit, b.saleCreditMargin)}
                valueText={money(b.saleCredit)}
                valueTone="warning"
                emphasis="strong"
            />
        {/if}
        <Row label="Total venta del día" valueText={money(b.totalSaleDay)} emphasis="total" />
        <div class="row flex items-center justify-between gap-3 px-4 py-3">
            <span class="text-[13px] font-medium text-muted-foreground">Rentabilidad</span>
            <span class="flex items-center gap-2">
                <span class="text-[15px] font-semibold tabular-nums {b.saleProfit >= 0 ? 'text-success' : 'text-destructive'}">
                    {money(b.saleProfit)}
                </span>
                <Pill label={percent(b.saleMargin)} tone={b.saleProfit >= 0 ? 'positive' : 'negative'} />
            </span>
        </div>
    </Group>

    <!-- D. SALIDAS DE DINERO -->
    <Group
        title="Salidas de dinero"
        caption="Egresos del día (no restan de la ganancia, salvo los gastos variables)"
    >
        {#if !hidePurchasePayments}
            <Row label="Abonos a compras" valueText={money(b.purchasePayments)} />
        {/if}
        {#if b.carrierPayments > 0}
            <Row label="Abonos a transportistas" valueText={money(b.carrierPayments)} />
        {/if}
        <Row label="Gastos variables" valueText={money(b.variableExpenses)} />
        <Row label="Total salidas de dinero" valueText={money(b.totalOutflows)} emphasis="total" />
    </Group>

    <!-- E. GANANCIA REAL -->
    <Group
        title="Ganancia real del día"
        caption="Ganancia de la venta menos gastos variables y el crédito del día aún sin cobrar"
    >
        <Row label="Ganancia (venta del día)" valueText={money(b.grossProfit)} valueTone="positive" />
        <Row label="Gastos variables" valueText={minus(b.variableExpenses)} valueTone="negative" />
        {#if b.uncollectedCreditProfit > 0}
            <Row label="Ganancia de crédito sin cobrar" valueText={minus(b.uncollectedCreditProfit)} valueTone="negative" />
        {/if}
        <div class="row flex items-center justify-between gap-3 bg-foreground/[0.025] px-4 py-4">
            <span class="text-[15px] font-bold text-foreground">Ganancia real</span>
            <span class="text-[19px] font-bold tabular-nums tracking-[-0.02em] {b.realProfit >= 0 ? 'text-success' : 'text-destructive'}">
                {b.realProfit < 0 ? '−' : ''}{money(Math.abs(b.realProfit))}
            </span>
        </div>
    </Group>
</div>
