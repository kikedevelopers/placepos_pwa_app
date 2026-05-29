<script lang="ts">
    import FadeInUp from '$lib/components/FadeInUp.svelte'
    import SegmentedTabs from './components/SegmentedTabs.svelte'
    import SalesReportView from './views/SalesReportView.svelte'
    import CreditsReportView from './views/CreditsReportView.svelte'
    import DailyClosureView from './views/DailyClosureView.svelte'
    import CashiersReportView from './views/CashiersReportView.svelte'

    const TABS = ['Ventas', 'Créditos', 'Resumen', 'Cajeros']
    let tab = $state(0)
</script>

<div class="flex flex-1 flex-col">
    <div class="px-5 pb-1 pt-4">
        <SegmentedTabs tabs={TABS} value={tab} onChange={(i) => (tab = i)} />
    </div>

    {#key tab}
        <FadeInUp index={0} class="flex-1">
            {#if tab === 0}
                <SalesReportView />
            {:else if tab === 1}
                <CreditsReportView />
            {:else if tab === 2}
                <DailyClosureView />
            {:else if tab === 3}
                <CashiersReportView />
            {/if}
        </FadeInUp>
    {/key}
</div>
