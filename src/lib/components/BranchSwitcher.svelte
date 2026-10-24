<script lang="ts">
    import { Building2, Check, ChevronDown, Plus, Store } from '@lucide/svelte'
    import { useProfile } from '$lib/hooks/useProfile'
    import { useSwitchBranch } from '$lib/hooks/useBranchMutations'
    import BottomSheet from '$lib/components/BottomSheet.svelte'
    import CreateBranchSheet from '$lib/components/CreateBranchSheet.svelte'

    // `onBrand`: dentro del header azul (texto claro). `default`: fondo claro.
    let { tone = 'default' }: { tone?: 'default' | 'onBrand' } = $props()
    const iconColor = $derived(tone === 'onBrand' ? 'rgba(255,255,255,0.78)' : 'hsl(215, 16%, 47%)')

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
        <Building2 size={12} color={iconColor} strokeWidth={2} />
        <span
            class="max-w-[150px] truncate text-[12px] {tone === 'onBrand'
                ? 'font-medium text-white/85'
                : 'text-muted-foreground'}">{primary.name}</span
        >
        <ChevronDown size={13} color={iconColor} strokeWidth={2} />
    </button>

    <BottomSheet open={listOpen} title="Mis negocios" onClose={() => (listOpen = false)}>
        <div class="flex flex-col gap-5 pb-1">
            <div class="surface group-rows overflow-hidden" role="radiogroup" aria-label="Negocio activo">
                {#each companies as company (company.id)}
                    {@const current = primary && company.id === primary.id}
                    <button
                        type="button"
                        role="radio"
                        aria-checked={!!current}
                        disabled={$switchBranch.isPending}
                        onclick={() => select(company.id)}
                        class="row flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-100 active:bg-foreground/[0.05] disabled:opacity-60"
                    >
                        <span
                            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] {company.is_branch
                                ? 'bg-foreground/[0.07] text-foreground/70'
                                : 'bg-primary/10 text-primary'}"
                        >
                            {#if company.is_branch}<Store size={17} strokeWidth={2.1} />{:else}<Building2 size={17} strokeWidth={2.1} />{/if}
                        </span>
                        <span class="min-w-0 flex-1">
                            <span class="block truncate text-[15px] {current ? 'font-semibold' : ''} text-foreground">{company.name}</span>
                            <span class="block text-[12px] text-muted-foreground">{company.is_branch ? 'Sucursal' : 'Negocio principal'}</span>
                        </span>
                        {#if current}
                            <Check size={18} strokeWidth={2.6} class="shrink-0 text-primary" />
                        {/if}
                    </button>
                {/each}
            </div>

            <div class="flex flex-col gap-2">
                <button
                    type="button"
                    onclick={openCreate}
                    disabled={reachedLimit}
                    class="surface flex h-[52px] w-full items-center justify-center gap-2 text-[15px] font-semibold text-primary transition-transform duration-150 ease-out active:scale-[0.98] disabled:text-muted-foreground disabled:active:scale-100"
                >
                    <Plus size={18} strokeWidth={2.4} />
                    Crear sucursal
                </button>
                <p class="px-1 text-center text-[12px] text-muted-foreground">
                    {#if reachedLimit}
                        Llegaste al límite de sucursales de tu plan ({allowed}).
                    {:else}
                        Puedes crear {allowed - branchCount} {allowed - branchCount === 1 ? 'sucursal más' : 'sucursales más'}.
                    {/if}
                </p>
            </div>
        </div>
    </BottomSheet>

    <CreateBranchSheet open={createOpen} onClose={() => (createOpen = false)} />
{/if}
