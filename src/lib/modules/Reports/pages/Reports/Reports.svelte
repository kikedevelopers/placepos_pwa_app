<script lang="ts">
    import FadeInUp from '$lib/components/FadeInUp.svelte'
    import { usePermissions } from '$lib/hooks/usePermissions.svelte'
    import ScrollTabs from './components/ScrollTabs.svelte'
    import ReportState from './components/ReportState.svelte'
    import SalesCreditsView from './views/SalesCreditsView.svelte'
    import ComparativeView from './views/ComparativeView.svelte'
    import FinanceView from './views/FinanceView.svelte'
    import CashiersReportView from './views/CashiersReportView.svelte'
    import CustomersRfmView from './views/CustomersRfmView.svelte'

    // Cada tab se muestra según su key de permiso (espejo del grupo Informes de
    // placepos). "Ventas y Créditos" aparece si tiene Ventas O Créditos (el
    // sub-toggle interno gatea cada uno). owner/superadmin ven todas.
    const permissions = usePermissions()
    const tabs = $derived(
        [
            {
                id: 'salescredits',
                label: 'Ventas y Créditos',
                show:
                    permissions.can('canAccessSalesReport') ||
                    permissions.can('canAccessCreditsReport')
            },
            {
                id: 'comparative',
                label: 'Comparativa',
                show: permissions.can('canAccessComparativeReport')
            },
            {
                id: 'finance',
                label: 'Finanzas',
                show: permissions.can('canAccessDailyClosureReport')
            },
            { id: 'cashiers', label: 'Cajeros', show: permissions.can('canAccessCashierReport') },
            { id: 'customers', label: 'Clientes', show: permissions.can('canAccessClientsReport') }
        ].filter((t) => t.show)
    )

    let tab = $state(0)
    // Si el índice queda fuera del set visible, lo acotamos para no renderizar
    // un tab inexistente.
    const activeIndex = $derived(Math.min(tab, Math.max(0, tabs.length - 1)))
    const activeId = $derived(tabs[activeIndex]?.id ?? null)
</script>

<div class="flex flex-1 flex-col">
    {#if tabs.length === 0}
        <ReportState kind="empty" message="No tienes acceso a ningún informe." />
    {:else}
        <div class="px-5 pb-1 pt-4">
            <ScrollTabs
                tabs={tabs.map((t) => t.label)}
                value={activeIndex}
                onChange={(i) => (tab = i)}
            />
        </div>

        {#key activeId}
            <FadeInUp index={0} class="flex-1">
                {#if activeId === 'salescredits'}
                    <SalesCreditsView />
                {:else if activeId === 'comparative'}
                    <ComparativeView />
                {:else if activeId === 'finance'}
                    <FinanceView />
                {:else if activeId === 'cashiers'}
                    <CashiersReportView />
                {:else if activeId === 'customers'}
                    <CustomersRfmView />
                {/if}
            </FadeInUp>
        {/key}
    {/if}
</div>
