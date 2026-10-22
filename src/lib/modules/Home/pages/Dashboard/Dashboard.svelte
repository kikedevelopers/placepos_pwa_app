<script lang="ts">
    import FadeInUp from '$lib/components/FadeInUp.svelte'
    import QuickActions from './components/QuickActions.svelte'
    import MonthGoalCard from './components/MonthGoalCard.svelte'
    import DaySummaryCard from './components/DaySummaryCard.svelte'
    import BranchesSummaryCard from './components/BranchesSummaryCard.svelte'
    import { useProfile } from '$lib/hooks/useProfile'
    import { shouldShowBranchesSummary } from './utils/branchesSummaryGate'

    // El resumen consolidado por sucursal es exclusivo del owner con sucursales
    // habilitadas y ≥1 activa (endpoint owner-only). La PWA es cloud-only.
    const profileQuery = useProfile()
    const showBranchesSummary = $derived(
        shouldShowBranchesSummary({
            userType: $profileQuery.data?.payload?.user_profile?.type,
            branchesEnabled:
                $profileQuery.data?.payload?.user_profile?.branches_enabled ?? false,
            companies: $profileQuery.data?.payload?.company_profile?.companies ?? []
        })
    )
</script>

<!--
    Móvil: una columna (accesos → meta → sucursales → ventas). Tablet+: los
    accesos arriba a todo el ancho y debajo dos columnas (meta y sucursales a la
    izquierda, ventas a la derecha), centradas con un ancho máximo.
-->
<div class="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 pb-10 pt-4 sm:px-6 md:gap-5 md:pt-6">
    <FadeInUp index={0} class="flex flex-col gap-3">
        <QuickActions />
    </FadeInUp>

    <div class="grid grid-cols-1 items-start gap-4 md:grid-cols-2 md:gap-5">
        <div class="flex min-w-0 flex-col gap-4 md:gap-5">
            <FadeInUp index={1}>
                <MonthGoalCard />
            </FadeInUp>
            {#if showBranchesSummary}
                <FadeInUp index={2}>
                    <BranchesSummaryCard />
                </FadeInUp>
            {/if}
        </div>
        <FadeInUp index={3} class="min-w-0">
            <DaySummaryCard />
        </FadeInUp>
    </div>
</div>
