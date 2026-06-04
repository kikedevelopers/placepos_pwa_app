<script lang="ts">
    import { Landmark, Plus } from '@lucide/svelte'
    import { getErrorMessage } from '$lib/utils/errors'
    import { useUserRole } from '$lib/hooks/useUserRole.svelte'
    import ScreenState from '$lib/components/ScreenState.svelte'
    import FadeInUp from '$lib/components/FadeInUp.svelte'
    import { useBanks } from './hooks/useBanks'
    import { useBankMovements } from './hooks/useBankMovements'
    import BankDashboard from './components/BankDashboard.svelte'
    import BankFormSheet from './components/BankFormSheet.svelte'

    const role = useUserRole()
    const query = useBanks()

    let selectedId = $state<number | null>(null)
    let createOpen = $state(false)

    const banks = $derived($query.data ?? [])
    const selected = $derived(banks.find((b) => b.id === selectedId) ?? banks[0] ?? null)

    const movementsQuery = useBankMovements(() => selected?.id ?? null)
</script>

<div class="flex flex-1 flex-col">
    <!-- Header premium con halo radial -->
    <header class="relative overflow-hidden px-5 pb-4 pt-5">
        <div
            class="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full opacity-60 blur-2xl"
            style="background: radial-gradient(circle, hsla(217,91%,50%,0.18), transparent 70%)"
            aria-hidden="true"
        ></div>
        <div class="flex items-start justify-between gap-3">
            <div>
                <h1 class="text-2xl font-bold tracking-tight text-foreground">Cuentas bancarias</h1>
                <p class="mt-0.5 text-sm text-muted-foreground">
                    Administra las cuentas bancarias de tu negocio
                </p>
            </div>
            {#if role.canManage}
                <button
                    type="button"
                    onclick={() => (createOpen = true)}
                    aria-label="Nueva cuenta"
                    class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform active:scale-[0.97]"
                    style="background:linear-gradient(135deg, hsl(213,94%,58%), hsl(217,91%,50%))"
                >
                    <Plus size={22} color="white" strokeWidth={2.5} />
                </button>
            {/if}
        </div>
    </header>

    <div class="flex flex-1 flex-col px-5 pb-8">
        {#if $query.isLoading}
            <ScreenState kind="loading" />
        {:else if $query.isError}
            <ScreenState kind="error" message={getErrorMessage($query.error)} />
        {:else if !selected}
            <div class="flex flex-1 items-center justify-center py-10">
                <button
                    type="button"
                    onclick={() => (createOpen = true)}
                    disabled={!role.canManage}
                    class="group flex flex-col items-center gap-5 rounded-3xl border-2 border-dashed border-border bg-card/50 px-10 py-12 transition-colors duration-200 hover:border-primary/40 hover:bg-primary/5 disabled:opacity-60"
                >
                    <div
                        class="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10"
                    >
                        <Landmark size={30} color="hsl(217, 91%, 50%)" strokeWidth={1.8} />
                    </div>
                    <div class="text-center">
                        <p class="text-base font-semibold text-foreground">
                            No hay cuentas registradas
                        </p>
                        <p class="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
                            Registra tu primera cuenta bancaria para gestionar tus finanzas y
                            habilitar métodos de cobro
                        </p>
                    </div>
                    {#if role.canManage}
                        <span
                            class="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
                        >
                            <Plus size={16} strokeWidth={2.5} />
                            Registrar primera cuenta
                        </span>
                    {/if}
                </button>
            </div>
        {:else}
            <FadeInUp index={0} class="mx-auto w-full max-w-4xl">
                <BankDashboard
                    {banks}
                    {selected}
                    movements={$movementsQuery.data ?? []}
                    isLoadingMovements={$movementsQuery.isLoading}
                    canManage={role.canManage}
                    canAdjust={role.canVoid}
                    onSelect={(id) => (selectedId = id)}
                />
            </FadeInUp>
        {/if}
    </div>
</div>

{#if createOpen}
    <BankFormSheet onClose={() => (createOpen = false)} />
{/if}
