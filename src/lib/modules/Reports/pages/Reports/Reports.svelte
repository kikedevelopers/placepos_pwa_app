<script lang="ts">
    import { goto } from '$app/navigation'
    import { page } from '$app/state'
    import { Lock } from '@lucide/svelte'
    import { EmptyState, TabRail } from '$lib/components/premium'
    import { usePermissions } from '$lib/hooks/usePermissions.svelte'
    import { resolveReportTab, visibleReportTabs, type ReportTabId } from './utils/reportTabs'
    import SalesReportView from './views/SalesReportView.svelte'
    import CreditsReportView from './views/CreditsReportView.svelte'
    import ComparativeView from './views/ComparativeView.svelte'
    import SummaryView from './views/SummaryView.svelte'
    import CashiersReportView from './views/CashiersReportView.svelte'
    import CustomersRfmView from './views/CustomersRfmView.svelte'
    import AgentOrdersView from '$lib/modules/AgentOrders/views/AgentOrdersView.svelte'
    import {
        useAgentOrdersAccess,
        useAgentOrdersPendingCount
    } from '$lib/modules/AgentOrders/hooks/useAgentOrdersAccess.svelte'

    // Mismas pestañas, nombres y permisos que el grupo "Informes" de placepos.
    // La activa vive en la URL (?tab=) para sobrevivir a recargas y enlaces.
    const permissions = usePermissions()
    const agentAccess = useAgentOrdersAccess()
    const pending = useAgentOrdersPendingCount(() => agentAccess.enabled)
    const tabs = $derived(
        visibleReportTabs((key) => permissions.can(key), { agentOrders: agentAccess.enabled })
    )
    const active = $derived(resolveReportTab(page.url.searchParams.get('tab'), tabs))

    const select = (id: string) => {
        if (id === active) return
        const url = new URL(page.url)
        url.searchParams.set('tab', id)
        goto(url, { replaceState: true, noScroll: true, keepFocus: true })
    }
</script>

<div class="flex flex-1 flex-col">
    {#if tabs.length === 0}
        <EmptyState
            icon={Lock}
            title="Sin informes disponibles"
            message="Tu rol no tiene acceso a ningún informe. Pídele al administrador que te lo habilite."
        />
    {:else}
        <div class="px-5 pb-2 pt-5">
            <TabRail
                ariaLabel="Informes"
                tabs={tabs.map((t) => ({
                    id: t.id,
                    label: t.label,
                    badge: t.id === 'agente' ? pending.count : undefined
                }))}
                value={active ?? ''}
                onChange={select}
            />
        </div>

        {#key active}
            <div class="flex-1 motion-safe:animate-fade-in-up" role="tabpanel">
                {#if active === ('sales' satisfies ReportTabId)}
                    <SalesReportView />
                {:else if active === 'credits'}
                    <CreditsReportView />
                {:else if active === 'comparative'}
                    <ComparativeView />
                {:else if active === 'summary'}
                    <SummaryView />
                {:else if active === 'cashiers'}
                    <CashiersReportView />
                {:else if active === 'customers'}
                    <CustomersRfmView />
                {:else if active === 'agente'}
                    <AgentOrdersView />
                {/if}
            </div>
        {/key}
    {/if}
</div>
