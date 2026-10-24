<script lang="ts">
    import { Wallet } from '@lucide/svelte'
    import type { WalletAccount } from '$lib/api/requests/wallets'
    import AccountCarousel from '$lib/modules/Finance/components/AccountCarousel.svelte'
    import AccountActions from '$lib/modules/Finance/components/AccountActions.svelte'
    import MovementsList from '$lib/modules/Finance/components/MovementsList.svelte'
    import AccountTransferSheet from '$lib/modules/Finance/components/AccountTransferSheet.svelte'
    import CashAdjustmentSheet from '$lib/modules/Finance/components/CashAdjustmentSheet.svelte'
    import { useMovementsRange } from '$lib/modules/Finance/hooks/useMovementsRange.svelte'
    import { useWalletMovements } from '../hooks/useWalletMovements'
    import WalletEditSheet from './WalletEditSheet.svelte'

    interface Props {
        wallets: WalletAccount[]
        selected: WalletAccount
        canManage: boolean
        canAdjust: boolean
        onSelect: (id: number) => void
    }
    let { wallets, selected, canManage, canAdjust, onSelect }: Props = $props()

    const range = useMovementsRange()
    const movementsQuery = useWalletMovements(
        () => selected.id,
        () => range.range
    )
    const movements = $derived($movementsQuery.data ?? [])

    let editOpen = $state(false)
    let transferOpen = $state(false)
    let adjustOpen = $state(false)

    const cards = $derived(
        wallets.map((w) => ({ id: w.id, name: w.name, subtitle: 'Billetera', balance: w.balance }))
    )
</script>

<div class="flex flex-col gap-6">
    <AccountCarousel kind="wallet" icon={Wallet} accounts={cards} selectedId={selected.id} {onSelect} />
    <AccountActions
        {canManage}
        {canAdjust}
        onTransfer={() => (transferOpen = true)}
        onAdjust={() => (adjustOpen = true)}
        onEdit={() => (editOpen = true)}
    />
    <MovementsList {movements} isLoading={$movementsQuery.isLoading} {range} />
</div>


{#if editOpen}
    <WalletEditSheet wallet={selected} onClose={() => (editOpen = false)} />
{/if}

{#if transferOpen}
    <AccountTransferSheet
        source={{ type: 'wallet', id: selected.id, name: selected.name, balance: selected.balance }}
        onClose={() => (transferOpen = false)}
    />
{/if}

{#if adjustOpen}
    <CashAdjustmentSheet
        target={{ kind: 'wallet', id: selected.id, name: selected.name, balance: selected.balance }}
        onClose={() => (adjustOpen = false)}
    />
{/if}
