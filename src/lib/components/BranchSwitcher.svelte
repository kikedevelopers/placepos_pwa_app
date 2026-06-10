<script lang="ts">
    import { Building2, Check, ChevronDown, Plus } from '@lucide/svelte'
    import { useProfile } from '$lib/hooks/useProfile'
    import { useSwitchBranch } from '$lib/hooks/useBranchMutations'
    import BottomSheet from '$lib/components/BottomSheet.svelte'
    import CreateBranchSheet from '$lib/components/CreateBranchSheet.svelte'

    const profileQuery = useProfile()
    const primary = $derived($profileQuery.data?.payload?.company_profile?.primary)
    const allCompanies = $derived($profileQuery.data?.payload?.company_profile?.companies ?? [])
    // En la lista solo el principal + sucursales activas. El límite de creación
    // cuenta TODAS las sucursales creadas.
    const companies = $derived(allCompanies.filter((c) => !c.is_branch || c.is_active))
    const branchCount = $derived(allCompanies.filter((c) => c.is_branch).length)
    const allowed = $derived($profileQuery.data?.payload?.user_profile?.branches_allowed ?? 0)
    const reachedLimit = $derived(branchCount >= allowed)

    const switchBranch = useSwitchBranch()

    let listOpen = $state(false)
    let createOpen = $state(false)

    const select = (id: number) => {
        if (!primary || id === primary.id || $switchBranch.isPending) return
        listOpen = false
        // onSuccess guarda el token nuevo y recarga la ventana.
        $switchBranch.mutate(id)
    }

    const openCreate = () => {
        listOpen = false
        createOpen = true
    }
</script>

{#if primary}
    <button
        type="button"
        aria-label="Cambiar de sucursal"
        onclick={() => (listOpen = true)}
        class="flex min-w-0 items-center gap-1 active:opacity-70"
    >
        <Building2 size={11} color="hsl(215, 16%, 47%)" strokeWidth={2} />
        <span class="max-w-[140px] truncate text-[11px] text-muted-foreground">{primary.name}</span>
        <ChevronDown size={12} color="hsl(215, 16%, 47%)" strokeWidth={2} />
    </button>

    <BottomSheet open={listOpen} title="Mis negocios" onClose={() => (listOpen = false)}>
        <div class="flex flex-col gap-1 pb-2">
            {#if reachedLimit}
                <div class="flex items-center gap-2.5 rounded-xl px-3 py-3 text-left text-sm text-muted-foreground">
                    <Plus size={18} />
                    Límite de sucursales alcanzado
                </div>
            {:else}
                <button
                    type="button"
                    onclick={openCreate}
                    class="flex items-center gap-2.5 rounded-xl px-3 py-3 text-left text-sm font-semibold text-primary active:bg-primary/[0.06]"
                >
                    <Plus size={18} />
                    Crear sucursal
                </button>
            {/if}

            <div class="my-1 border-t border-border/50"></div>

            {#each companies as company (company.id)}
                <button
                    type="button"
                    onclick={() => select(company.id)}
                    class="flex items-center justify-between gap-3 rounded-xl px-3 py-3 text-left active:bg-secondary {primary &&
                    company.id === primary.id
                        ? 'bg-secondary/60'
                        : ''}"
                >
                    <span class="flex min-w-0 flex-col">
                        <span class="truncate text-sm font-medium text-foreground">{company.name}</span>
                        {#if !company.is_branch}
                            <span class="text-[11px] text-muted-foreground">Principal</span>
                        {/if}
                    </span>
                    {#if primary && company.id === primary.id}
                        <Check size={18} color="hsl(217, 91%, 50%)" />
                    {/if}
                </button>
            {/each}
        </div>
    </BottomSheet>

    <CreateBranchSheet open={createOpen} onClose={() => (createOpen = false)} />
{/if}
