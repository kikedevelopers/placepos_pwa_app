<script lang="ts">
    import { Hero, Metrics } from '$lib/components/premium'
    import { formatCurrency } from '$lib/utils/numbers'
    import type { FixedExpensesSummaryData } from '../../hooks/useFixedExpensesSummary.svelte'
    import { nextCutLabel } from '../../utils/fixedExpenseTime'

    interface Props {
        summary: FixedExpensesSummaryData
    }
    let { summary }: Props = $props()
</script>

<Hero
    label="Acumulado en curso"
    amount={summary.accruedToday}
    caption={`Proyección mensual ${formatCurrency(summary.monthlyProjection, 0)}`}
/>
<Metrics
    ariaLabel="Resumen de gastos fijos"
    items={[
        { label: 'Gastos activos', text: summary.activeCount.toLocaleString('es-CO') },
        { label: 'Próximo corte', text: nextCutLabel(summary.nextPeriodEnd, new Date()) }
    ]}
/>
