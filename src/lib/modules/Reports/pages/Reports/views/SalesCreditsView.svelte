<script lang="ts">
    import { usePermissions } from '$lib/hooks/usePermissions.svelte'
    import SegmentedTabs from '../components/SegmentedTabs.svelte'
    import SalesReportView from './SalesReportView.svelte'
    import CreditsReportView from './CreditsReportView.svelte'

    // Sub-toggle gateado por permiso: Ventas (canAccessSalesReport) y Créditos
    // (canAccessCreditsReport) se muestran de forma independiente.
    const permissions = usePermissions()
    const subs = $derived(
        [
            { id: 'sales', label: 'Ventas', show: permissions.can('canAccessSalesReport') },
            { id: 'credits', label: 'Créditos', show: permissions.can('canAccessCreditsReport') }
        ].filter((s) => s.show)
    )

    let sub = $state(0)
    const activeIndex = $derived(Math.min(sub, Math.max(0, subs.length - 1)))
    const activeId = $derived(subs[activeIndex]?.id ?? null)
</script>

<div class="flex flex-col">
    <!-- Con un solo sub-permiso, no se muestra el toggle (una sola vista). -->
    {#if subs.length > 1}
        <div class="px-5 pb-1 pt-2">
            <SegmentedTabs
                tabs={subs.map((s) => s.label)}
                value={activeIndex}
                onChange={(i) => (sub = i)}
            />
        </div>
    {/if}

    {#if activeId === 'sales'}
        <SalesReportView />
    {:else if activeId === 'credits'}
        <CreditsReportView />
    {/if}
</div>
