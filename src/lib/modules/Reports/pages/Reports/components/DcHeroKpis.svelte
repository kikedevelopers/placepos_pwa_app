<script lang="ts">
    import { Banknote, PiggyBank, TrendingUp, Wallet } from '@lucide/svelte'
    import type { DailyClosure } from '$lib/api/requests/reports'
    import type { TodaySummary } from '$lib/api/requests/dashboard'
    import { formatCurrency } from '$lib/utils/numbers'
    import ReportStatCard from './ReportStatCard.svelte'

    interface Props {
        dc: DailyClosure
        today?: TodaySummary
    }
    let { dc, today }: Props = $props()

    const totalCollected = $derived(
        today?.totalCollected ??
            dc.cashSalesTotal + dc.consignacionesVentas + dc.creditsBreakdown.abonosTotal
    )
    const realProfit = $derived(today?.realProfit ?? dc.profit - dc.expensesTotal)
    const surplus = $derived(today?.surplus ?? totalCollected - dc.profit)
</script>

<div class="flex flex-col gap-3">
    <div class="flex gap-3">
        <ReportStatCard
            icon={Banknote}
            tint="primary"
            label="Total recaudado"
            value={formatCurrency(totalCollected)}
            description="Ventas + cartera"
        />
        <ReportStatCard
            icon={TrendingUp}
            tint="success"
            label="Ganancia real"
            value={formatCurrency(realProfit)}
            description="Ganancia − gastos"
        />
    </div>
    <div class="flex gap-3">
        <ReportStatCard
            icon={PiggyBank}
            tint="info"
            label="Excedente"
            value={formatCurrency(surplus)}
            description="Reinversión"
        />
        <ReportStatCard
            icon={Wallet}
            tint="warning"
            label="Cartera pendiente"
            value={formatCurrency(dc.totalPendingCredits.balance)}
            description={`${dc.totalPendingCredits.count} créditos activos`}
        />
    </div>
</div>
