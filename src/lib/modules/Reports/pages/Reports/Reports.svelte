<script lang="ts">
    import FadeInUp from '$lib/components/FadeInUp.svelte'
    import ScrollTabs from './components/ScrollTabs.svelte'
    import SalesCreditsView from './views/SalesCreditsView.svelte'
    import ComparativeView from './views/ComparativeView.svelte'
    import FinanceView from './views/FinanceView.svelte'
    import CashiersReportView from './views/CashiersReportView.svelte'
    import CustomersRfmView from './views/CustomersRfmView.svelte'

    const TABS = ['Ventas y Créditos', 'Comparativa', 'Finanzas', 'Cajeros', 'Clientes'] as const
    let tab = $state(0)
</script>

<div class="flex flex-1 flex-col">
    <div class="px-5 pb-1 pt-4">
        <ScrollTabs tabs={TABS} value={tab} onChange={(i) => (tab = i)} />
    </div>

    {#key tab}
        <FadeInUp index={0} class="flex-1">
            {#if tab === 0}
                <SalesCreditsView />
            {:else if tab === 1}
                <ComparativeView />
            {:else if tab === 2}
                <FinanceView />
            {:else if tab === 3}
                <CashiersReportView />
            {:else if tab === 4}
                <CustomersRfmView />
            {/if}
        </FadeInUp>
    {/key}
</div>
