<script lang="ts">
    import { Scale } from '@lucide/svelte'
    import type { TodaySummary } from '$lib/api/requests/dashboard'
    import { formatCurrency } from '$lib/utils/numbers'
    import SectionBlock from './SectionBlock.svelte'
    import LineRow from './LineRow.svelte'

    interface Props {
        today: TodaySummary
    }
    let { today }: Props = $props()

    const LABEL = 'text-[11px] uppercase tracking-[1px] text-muted-foreground/70 mb-1'
</script>

<SectionBlock
    icon={Scale}
    accent="primary"
    title="Descomposición patrimonial"
    subtitle="Reinversión y ganancia real"
>
    <p class={LABEL}>Reinversión</p>
    <LineRow label="Total recaudado" value={formatCurrency(today.totalCollected)} tone="asset" />
    <LineRow label="Ganancia del día" value={formatCurrency(today.profit)} />
    <div class="mt-1 border-t border-border/60">
        <LineRow
            label="Excedente (reinversión)"
            value={formatCurrency(today.surplus)}
            tone={today.surplus >= 0 ? 'info' : 'liability'}
            bold
        />
    </div>

    <p class="{LABEL} mt-4">Ganancia real</p>
    <LineRow label="Ganancia del día" value={formatCurrency(today.profit)} tone="asset" />
    <LineRow label="Gastos del día" value={formatCurrency(today.expenses)} tone="liability" />
    <div class="mt-1 border-t border-border/60">
        <LineRow
            label="Ganancia real"
            value={formatCurrency(today.realProfit)}
            tone={today.realProfit >= 0 ? 'asset' : 'liability'}
            bold
        />
    </div>
</SectionBlock>
