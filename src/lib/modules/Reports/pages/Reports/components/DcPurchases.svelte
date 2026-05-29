<script lang="ts">
    import { Package } from '@lucide/svelte'
    import type { TodaySummary } from '$lib/api/requests/dashboard'
    import { formatCurrency } from '$lib/utils/numbers'
    import SectionBlock from './SectionBlock.svelte'
    import LineRow from './LineRow.svelte'
    import Badge from './Badge.svelte'

    interface Props {
        today: TodaySummary
    }
    let { today }: Props = $props()
    const p = $derived(today.purchases)
</script>

<SectionBlock
    icon={Package}
    accent="info"
    title="Compras del día"
    subtitle="Reposición de inventario"
>
    {#snippet right()}
        <Badge label={`${p.count} compra(s)`} tone="info" />
    {/snippet}

    <LineRow label="Total comprado" value={formatCurrency(p.total)} />
    <LineRow label="Abonos en efectivo" value={formatCurrency(p.paymentsCash)} indent />
    <LineRow label="Abonos por consignación" value={formatCurrency(p.paymentsTransfer)} indent />
    <div class="mt-1 border-t border-border/60">
        <LineRow
            label="Total abonado hoy"
            value={formatCurrency(p.paymentsTotal)}
            tone="primary"
            bold
        />
    </div>
    <LineRow
        label="Deuda con proveedores"
        value={formatCurrency(p.supplierDebt)}
        tone={p.supplierDebt > 0 ? 'liability' : 'asset'}
    />
</SectionBlock>
