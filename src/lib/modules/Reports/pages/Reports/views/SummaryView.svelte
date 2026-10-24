<script lang="ts">
    import { RefreshCw } from '@lucide/svelte'
    import { useQueryClient } from '@tanstack/svelte-query'
    import { getErrorMessage } from '$lib/utils/errors'
    import { todayISO } from '$lib/utils/dates'
    import { useProfile } from '$lib/hooks/useProfile'
    import { usePermissions } from '$lib/hooks/usePermissions.svelte'
    import { EmptyState, Hero, Metrics, Segmented, Skeleton, SkeletonList, percent } from '$lib/components/premium'
    import { useDayClosure, useDaySummary } from '../hooks/useDayClosure'
    import { useSalesByHour } from '../hooks/useSalesByHour'
    import { buildDayBreakdown } from '../utils/buildDayBreakdown'
    import { shouldShowBranchesClosure } from '../utils/branchesClosureGate'
    import DayChip from '../components/DayChip.svelte'
    import SalesByHourChart from '../components/SalesByHourChart.svelte'
    import MoneyDistribution from '../components/MoneyDistribution.svelte'
    import DayBreakdownSections from '../components/DayBreakdownSections.svelte'
    import BranchesClosureView from './BranchesClosureView.svelte'

    /**
     * "Resumen" — espejo del módulo Resumen de placepos: día elegible (hoy por
     * defecto, nunca futuro), venta por horas, "¿Dónde está el dinero?" y el
     * desglose A–E calculado con el MISMO buildDayBreakdown. Para el admin del
     * negocio principal con sucursales, segunda pestaña "Sucursales".
     */
    const profileQuery = useProfile()
    const permissions = usePermissions()
    const queryClient = useQueryClient()

    const showBranches = $derived(
        shouldShowBranchesClosure({
            isAdminLevel: permissions.isAdminLevel,
            primaryIsBranch: $profileQuery.data?.payload?.company_profile?.primary?.is_branch,
            branchesEnabled: $profileQuery.data?.payload?.user_profile?.branches_enabled ?? false,
            companies: $profileQuery.data?.payload?.company_profile?.companies ?? []
        })
    )

    let date = $state(todayISO())
    let view = $state<'day' | 'branches'>('day')

    const closure = useDayClosure(() => date)
    const daySummary = useDaySummary(() => date)
    const byHour = useSalesByHour(() => date)

    const b = $derived($closure.data ? buildDayBreakdown($closure.data, $daySummary.data?.purchases.paymentsTotal ?? 0) : null)
    const refreshing = $derived($closure.isFetching || $byHour.isFetching)
    const refresh = () => queryClient.invalidateQueries({ queryKey: ['reports', 'daily-closure'] })
</script>

<div class="flex flex-col gap-4 px-5 pb-6 pt-2">
    <div class="flex items-center gap-2">
        <DayChip value={date} onChange={(v) => (date = v)} />
        <button
            type="button"
            onclick={refresh}
            aria-label="Actualizar"
            class="flex h-9 w-9 items-center justify-center rounded-full bg-card text-foreground shadow-[inset_0_0_0_1px_rgba(15,23,42,0.08)] transition-transform duration-150 ease-out active:scale-[0.92]"
        >
            <RefreshCw size={15} strokeWidth={2.2} class={refreshing ? 'animate-spin' : ''} />
        </button>
    </div>

    {#if showBranches}
        <Segmented
            ariaLabel="Vista del resumen"
            options={[
                { value: 'day', label: 'Resumen del día' },
                { value: 'branches', label: 'Sucursales' }
            ]}
            value={view}
            onChange={(v) => (view = v)}
        />
    {/if}

    {#if showBranches && view === 'branches'}
        <BranchesClosureView {date} />
    {:else if $closure.isLoading}
        <div class="surface px-5 pb-5 pt-[18px]">
            <Skeleton class="h-3.5 w-28" />
            <Skeleton class="mt-3 h-9 w-44" />
        </div>
        <SkeletonList rows={5} />
    {:else if $closure.isError || !b}
        <EmptyState
            kind="error"
            title="No se pudo calcular el resumen"
            message={getErrorMessage($closure.error)}
        />
    {:else}
        <Hero
            label="Ganancia real del día"
            amount={b.realProfit}
            tone={b.realProfit < 0 ? 'negative' : 'default'}
            caption={`Margen de la venta ${percent(b.saleMargin)}`}
        />
        <Metrics
            ariaLabel="Cifras del día"
            items={[
                { label: 'Total venta del día', amount: b.totalSaleDay },
                { label: 'Total recogido', amount: b.totalCollected, tone: b.totalCollected > 0 ? 'brand' : 'neutral' },
                { label: 'Venta a crédito', amount: b.saleCredit, tone: b.saleCredit > 0 ? 'warning' : 'neutral' },
                { label: 'Salidas de dinero', amount: b.totalOutflows }
            ]}
        />

        <SalesByHourChart hours={$byHour.data?.hours ?? []} loading={$byHour.isLoading} />
        <MoneyDistribution cash={b.totalCashCollected} consign={b.totalConsignCollected} credit={b.saleCredit} />

        <div class="mt-2">
            <DayBreakdownSections {b} />
        </div>
    {/if}
</div>
