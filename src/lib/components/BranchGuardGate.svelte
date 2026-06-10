<script lang="ts">
    import { AlertTriangle, Check, Loader2, Store } from '@lucide/svelte'
    import { useProfile } from '$lib/hooks/useProfile'
    import { useSetActiveBranches, useSwitchBranch } from '$lib/hooks/useBranchMutations'

    /**
     * Vigila el gating de sucursales del owner:
     *   1. Auto-switch al principal si el JWT está en una sucursal suspendida o
     *      las sucursales fueron inhabilitadas.
     *   2. Modal BLOQUEANTE de reconciliación si hay más sucursales activas que
     *      el límite permitido (obliga a elegir cuáles conservar).
     * Montado una vez en el layout. No hace nada si la cuenta no usa sucursales.
     */
    const profileQuery = useProfile()
    const primary = $derived($profileQuery.data?.payload?.company_profile?.primary)
    const companies = $derived($profileQuery.data?.payload?.company_profile?.companies ?? [])
    const userProfile = $derived($profileQuery.data?.payload?.user_profile)
    const branchesEnabled = $derived(userProfile?.branches_enabled ?? false)
    const allowed = $derived(userProfile?.branches_allowed ?? 0)

    const mainCompany = $derived(companies.find((c) => !c.is_branch))
    const activeBranches = $derived(companies.filter((c) => c.is_branch && c.is_active))
    const stuckOnInvalidBranch = $derived(
        !!primary && primary.is_branch && (!branchesEnabled || !primary.is_active)
    )
    const needsReconcile = $derived(branchesEnabled && activeBranches.length > allowed)

    const switchBranch = useSwitchBranch()
    const setActive = useSetActiveBranches()

    let selected = $state(new Set<number>())

    // Auto-switch al principal cuando el JWT quedó en una sucursal inválida.
    $effect(() => {
        if (stuckOnInvalidBranch && mainCompany && !$switchBranch.isPending) {
            $switchBranch.mutate(mainCompany.id)
        }
    })

    const toggle = (id: number) => {
        const next = new Set(selected)
        if (next.has(id)) next.delete(id)
        else if (next.size < allowed) next.add(id)
        selected = next
    }

    const confirm = () => {
        if (selected.size > allowed || $setActive.isPending) return
        $setActive.mutate([...selected])
    }
</script>

{#if !stuckOnInvalidBranch && needsReconcile}
    <div
        class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
    >
        <div class="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
            <div class="border-b border-border/60 bg-gradient-to-br from-warning/[0.12] to-transparent px-6 pb-5 pt-6">
                <div class="flex items-start gap-3.5">
                    <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-warning/15 text-warning">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <h2 class="text-base font-bold text-foreground">Elige tus sucursales</h2>
                        <p class="mt-1 text-xs leading-relaxed text-muted-foreground">
                            Tu plan permite {allowed}
                            {allowed === 1 ? 'sucursal' : 'sucursales'} y tienes
                            {activeBranches.length} activas. Selecciona cuáles conservar; las demás
                            quedarán suspendidas (sus datos se conservan).
                        </p>
                    </div>
                </div>
            </div>

            <div class="max-h-[320px] space-y-1.5 overflow-y-auto px-4 py-4">
                {#each activeBranches as branch (branch.id)}
                    {@const isOn = selected.has(branch.id)}
                    {@const disabled = !isOn && selected.size >= allowed}
                    <button
                        type="button"
                        onclick={() => toggle(branch.id)}
                        {disabled}
                        class="flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors {isOn
                            ? 'border-primary/40 bg-primary/[0.06]'
                            : 'border-border active:bg-accent/40'} {disabled ? 'cursor-not-allowed opacity-50' : ''}"
                    >
                        <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                            <Store size={16} />
                        </div>
                        <span class="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                            {branch.name}
                        </span>
                        <span
                            class="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border {isOn
                                ? 'border-primary bg-primary text-white'
                                : 'border-border'}"
                        >
                            {#if isOn}<Check size={14} />{/if}
                        </span>
                    </button>
                {/each}
            </div>

            <div class="flex items-center justify-between gap-3 border-t border-border/60 px-6 py-4">
                <span class="text-xs text-muted-foreground">{selected.size} / {allowed} seleccionadas</span>
                <button
                    type="button"
                    onclick={confirm}
                    disabled={selected.size > allowed || $setActive.isPending}
                    class="flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60"
                >
                    {#if $setActive.isPending}<Loader2 size={16} class="animate-spin" />{/if}
                    Confirmar
                </button>
            </div>
        </div>
    </div>
{/if}
