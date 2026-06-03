<script lang="ts">
    import SegmentedTabs from '../components/SegmentedTabs.svelte'
    import SalesReportView from './SalesReportView.svelte'
    import CreditsReportView from './CreditsReportView.svelte'

    // Sub-toggle interno del tab "Ventas y Créditos".
    let sub = $state(0)
</script>

<div class="flex flex-col">
    <div class="px-5 pb-1 pt-2">
        <SegmentedTabs tabs={['Ventas', 'Créditos']} value={sub} onChange={(i) => (sub = i)} />
    </div>

    {#if sub === 0}
        <SalesReportView />
    {:else}
        <CreditsReportView />
    {/if}
</div>
