<script lang="ts">
    import { Landmark, Plus } from '@lucide/svelte'
    import { getErrorMessage } from '$lib/utils/errors'
    import { formatCurrency } from '$lib/utils/numbers'
    import { totalBalance } from '$lib/modules/Finance/utils/accountScreen'
    import { useUserRole } from '$lib/hooks/useUserRole.svelte'
    import { EmptyState, Skeleton } from '$lib/components/premium'
    import { useBanks } from './hooks/useBanks'
    import BankDashboard from './components/BankDashboard.svelte'
    import BankFormSheet from './components/BankFormSheet.svelte'

    const role = useUserRole()
    const query = useBanks()

    let selectedId = $state<number | null>(null)
    let createOpen = $state(false)

    const banks = $derived($query.data ?? [])
    const selected = $derived(banks.find((b) => b.id === selectedId) ?? banks[0] ?? null)
    const total = $derived(banks.length > 0 ? totalBalance(banks) : null)
</script>

<div class="flex flex-col gap-5 px-5 pb-6 pt-5">
    <header class="flex items-center justify-between gap-3">
        <div class="min-w-0">
            <h1 class="text-[26px] font-bold leading-tight tracking-[-0.03em] text-foreground">Bancos</h1>
            {#if total !== null}
                <p class="mt-0.5 text-[13px] text-muted-foreground">
                    Total <span class="font-semibold tabular-nums text-foreground">{formatCurrency(total)}</span>
                </p>
            {/if}
        </div>
        {#if role.canManage}
            <button
                type="button"
                onclick={() => (createOpen = true)}
                aria-label="Nueva cuenta"
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_6px_14px_-6px_hsl(var(--primary)/0.7)] transition-transform duration-150 ease-out active:scale-[0.92]"
            >
                <Plus size={20} strokeWidth={2.5} />
            </button>
        {/if}
    </header>

    {#if $query.isLoading}
        <Skeleton class="aspect-[1.72] w-full rounded-[24px]" />
    {:else if $query.isError}
        <EmptyState kind="error" title="No se pudo cargar" message={getErrorMessage($query.error)} />
    {:else if !selected}
        <EmptyState icon={Landmark} title="Sin cuentas bancarias" message="Registra una cuenta para recibir consignaciones y moverlas desde aquí.">
            {#snippet action()}
                {#if role.canManage}
                    <button
                        type="button"
                        onclick={() => (createOpen = true)}
                        class="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-[15px] font-semibold text-primary-foreground transition-transform active:scale-[0.96]"
                    >
                        <Plus size={17} strokeWidth={2.5} />
                        Nueva cuenta
                    </button>
                {/if}
            {/snippet}
        </EmptyState>
    {:else}
        <BankDashboard
            {banks}
            {selected}
            canManage={role.canManage}
            canAdjust={role.canVoid}
            onSelect={(id) => (selectedId = id)}
        />
    {/if}
</div>

{#if createOpen}
    <BankFormSheet onClose={() => (createOpen = false)} />
{/if}
