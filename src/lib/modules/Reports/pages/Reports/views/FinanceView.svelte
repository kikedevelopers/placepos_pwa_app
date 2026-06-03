<script lang="ts">
    import SegmentedTabs from '../components/SegmentedTabs.svelte'
    import DailyClosureView from './DailyClosureView.svelte'
    import ExtendedSummaryView from './ExtendedSummaryView.svelte'

    // Sub-toggle del tab "Finanzas": Resumen del día vs Resumen extendido.
    let sub = $state(0)
</script>

<div class="flex flex-col">
    <div class="px-5 pb-1 pt-2">
        <SegmentedTabs tabs={['Resumen del día', 'Extendido']} value={sub} onChange={(i) => (sub = i)} />
    </div>

    {#if sub === 0}
        <DailyClosureView />
    {:else}
        <ExtendedSummaryView />
    {/if}
</div>
