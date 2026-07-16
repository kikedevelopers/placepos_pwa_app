<script lang="ts">
    import { Banknote, PiggyBank, TrendingUp, Wallet } from '@lucide/svelte'
    import type { DailyClosure } from '$lib/api/requests/reports'
    import type { TodaySummary } from '$lib/api/requests/dashboard'
    import { formatCurrency } from '$lib/utils/numbers'
    import { heroRealProfit, heroSurplus, heroTotalSales } from '../utils/ventasDevengado'
    import ReportStatCard from './ReportStatCard.svelte'

    interface Props {
        dc: DailyClosure
        today?: TodaySummary
    }
    let { dc, today }: Props = $props()

    // DEVENGADO: el crédito del día cuenta como venta. "Total Ventas del día",
    // "Ganancia real" y "Excedente" salen de los campos sales* de /dashboard/today
    // (fallback al cierre). La caja/Meta del mes no se muestra aquí.
    const totalSales = $derived(heroTotalSales(dc, today))
    const realProfit = $derived(heroRealProfit(dc, today))
    const surplus = $derived(heroSurplus(dc, today))
</script>

<div class="flex flex-col gap-3">
    <div class="flex gap-3">
        <ReportStatCard
            icon={Banknote}
            tint="primary"
            label="Total Ventas del día"
            value={formatCurrency(totalSales)}
            description="Contado + crédito del día"
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
