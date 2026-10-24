<script lang="ts">
    import { Plus, Wallet } from '@lucide/svelte'
    import { getErrorMessage } from '$lib/utils/errors'
    import { formatCurrency } from '$lib/utils/numbers'
    import { totalBalance } from '$lib/modules/Finance/utils/accountScreen'
    import { useUserRole } from '$lib/hooks/useUserRole.svelte'
    import { EmptyState, Skeleton } from '$lib/components/premium'
    import { useWallets } from './hooks/useWallets'
    import WalletDashboard from './components/WalletDashboard.svelte'
    import WalletFormSheet from './components/WalletFormSheet.svelte'

    const role = useUserRole()
    const query = useWallets()

    let selectedId = $state<number | null>(null)
    let createOpen = $state(false)

    const wallets = $derived($query.data ?? [])
    const selected = $derived(wallets.find((w) => w.id === selectedId) ?? wallets[0] ?? null)
    const total = $derived(wallets.length > 0 ? totalBalance(wallets) : null)
</script>

<div class="flex flex-col gap-5 px-5 pb-6 pt-5">
    <header class="flex items-center justify-between gap-3">
        <div class="min-w-0">
            <h1 class="text-[26px] font-bold leading-tight tracking-[-0.03em] text-foreground">Billeteras</h1>
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
                aria-label="Nueva billetera"
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
        <EmptyState icon={Wallet} title="Sin billeteras" message="Registra una billetera para separar el efectivo y las cajas del negocio.">
            {#snippet action()}
                {#if role.canManage}
                    <button
                        type="button"
                        onclick={() => (createOpen = true)}
                        class="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-[15px] font-semibold text-primary-foreground transition-transform active:scale-[0.96]"
                    >
                        <Plus size={17} strokeWidth={2.5} />
                        Nueva billetera
                    </button>
                {/if}
            {/snippet}
        </EmptyState>
    {:else}
        <WalletDashboard
            {wallets}
            {selected}
            canManage={role.canManage}
            canAdjust={role.canVoid}
            onSelect={(id) => (selectedId = id)}
        />
    {/if}
</div>

{#if createOpen}
    <WalletFormSheet onClose={() => (createOpen = false)} />
{/if}
