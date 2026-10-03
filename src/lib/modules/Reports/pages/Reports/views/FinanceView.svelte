<script lang="ts">
    import SegmentedTabs from '../components/SegmentedTabs.svelte'
    import DailyClosureView from './DailyClosureView.svelte'
    import ResumenSucursalesView from './ResumenSucursalesView.svelte'
    import { useProfile } from '$lib/hooks/useProfile'
    import { usePermissions } from '$lib/hooks/usePermissions.svelte'
    import { shouldShowBranchesClosure } from '../utils/branchesClosureGate'

    // La pestaña "Sucursales" (reemplaza al "Extendido") solo para admin del
    // negocio principal, con sucursales activas. La PWA es cloud-only.
    const profileQuery = useProfile()
    const permissions = usePermissions()
    const showBranches = $derived(
        shouldShowBranchesClosure({
            isAdminLevel: permissions.isAdminLevel,
            primaryIsBranch: $profileQuery.data?.payload?.company_profile?.primary?.is_branch,
            branchesEnabled: $profileQuery.data?.payload?.user_profile?.branches_enabled ?? false,
            companies: $profileQuery.data?.payload?.company_profile?.companies ?? []
        })
    )

    // Sub-toggle del tab "Finanzas": Resumen del día vs Sucursales.
    let sub = $state(0)
</script>

<div class="flex flex-col">
    {#if showBranches}
        <div class="px-5 pb-1 pt-2">
            <SegmentedTabs
                tabs={['Resumen del día', 'Sucursales']}
                value={sub}
                onChange={(i) => (sub = i)}
            />
        </div>

        {#if sub === 0}
            <DailyClosureView />
        {:else}
            <ResumenSucursalesView />
        {/if}
    {:else}
        <DailyClosureView />
    {/if}
</div>
