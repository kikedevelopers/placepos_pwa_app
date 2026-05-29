<script lang="ts">
    import FadeInUp from '$lib/components/FadeInUp.svelte'
    import SectionHeader from './components/SectionHeader.svelte'
    import QuickActions from './components/QuickActions.svelte'
    import MonthGoalCard from './components/MonthGoalCard.svelte'
    import DaySummaryCard from './components/DaySummaryCard.svelte'
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

    <FadeInUp index={2}>
        <DaySummaryCard />
    </FadeInUp>
</div>
