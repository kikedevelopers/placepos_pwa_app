<script lang="ts">
    import { FileWarning, HandCoins, ShoppingBag } from '@lucide/svelte'
    import type { DailyClosure } from '$lib/api/requests/reports'
    import { formatCurrency } from '$lib/utils/numbers'
    import SectionBlock from './SectionBlock.svelte'
    import LineRow from './LineRow.svelte'

    interface Props {
        dc: DailyClosure
    }
    let { dc }: Props = $props()
    const cb = $derived(dc.creditsBreakdown)
</script>

<SectionBlock
    icon={ShoppingBag}
    accent="success"
    title="Ventas del día"
    subtitle="Ingresos por ventas directas"
>
    <LineRow label="Efectivo recibido" value={formatCurrency(dc.cashSalesTotal)} tone="asset" />
    {#if dc.consignacionesDetalle.length > 0}
        {#each dc.consignacionesDetalle as bank, i (`${bank.bankName}-${i}`)}
            <LineRow
                label={`Consignación — ${bank.bankName || 'Sin especificar'}`}
                value={formatCurrency(bank.amount)}
                tone="asset"
                indent
            />
        {/each}
    {:else if dc.consignacionesVentas > 0}
        <LineRow
            label="Consignación"
            value={formatCurrency(dc.consignacionesVentas)}
            tone="asset"
            indent
        />
    {/if}
    <div class="mt-1 border-t border-border/60">
        <LineRow
            label="Total Ventas del Día"
            value={formatCurrency(dc.cashSalesTotal + dc.consignacionesVentas)}
            bold
        />
    </div>
    <LineRow
        label="Rentabilidad"
        value={`${formatCurrency(dc.salesProfit)} · ${dc.salesMargin.toFixed(1)}%`}
        tone={dc.salesProfit >= 0 ? 'asset' : 'liability'}
    />
</SectionBlock>

<SectionBlock
    icon={HandCoins}
    accent="warning"
    title="Recaudo de cartera"
    subtitle="Abonos a créditos pendientes"
>
    <LineRow label="Abonos en efectivo" value={formatCurrency(cb.abonosCash)} tone="asset" />
    {#each cb.abonosConsignacionDetalle as bank, i (`${bank.bankName}-${i}`)}
        <LineRow
            label={`Abono por consignación — ${bank.bankName || 'Sin especificar'}`}
            value={formatCurrency(bank.amount)}
            tone="asset"
            indent
        />
    {/each}
    <div class="mt-1 border-t border-border/60">
        <LineRow label="Total Cartera Recogida" value={formatCurrency(cb.abonosTotal)} bold />
    </div>
    <LineRow
        label="Rentabilidad"
        value={`${formatCurrency(dc.creditsProfit)} · ${dc.creditsMargin.toFixed(1)}%`}
        tone={dc.creditsProfit >= 0 ? 'asset' : 'liability'}
    />
</SectionBlock>

<SectionBlock
    icon={FileWarning}
    accent="warning"
    title="Créditos generados hoy"
    subtitle="Pasivo — dinero por cobrar, no entra al recaudo"
>
    <LineRow label="Cantidad" value={String(cb.newCreditsCount)} />
    <LineRow label="Valor total" value={formatCurrency(cb.newCreditsTotal)} tone="warning" bold />
</SectionBlock>
