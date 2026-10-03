<script lang="ts">
    import FadeInUp from '$lib/components/FadeInUp.svelte'
    import SectionHeader from './components/SectionHeader.svelte'
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

<div class="flex flex-1 flex-col gap-6 px-5 pb-8 pt-4">
    <FadeInUp index={0}>
        <div>
            <SectionHeader title="Accesos rápidos" />
            <QuickActions />
        </div>
    </FadeInUp>

    <FadeInUp index={1}>
        <MonthGoalCard />
    </FadeInUp>

    {#if showBranchesSummary}
        <FadeInUp index={2}>
            <BranchesSummaryCard />
        </FadeInUp>
    {/if}

    <FadeInUp index={3}>
        <DaySummaryCard />
    </FadeInUp>
</div>
