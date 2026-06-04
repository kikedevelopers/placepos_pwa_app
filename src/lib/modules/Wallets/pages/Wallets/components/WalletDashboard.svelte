<script lang="ts">
    import { Wallet } from '@lucide/svelte'
    import type { WalletAccount } from '$lib/api/requests/wallets'
    import type { FinancialMovement } from '$lib/api/requests/financial-movements/types'
    import AccountSelectorButton from '$lib/modules/Finance/components/AccountSelectorButton.svelte'
    import AccountPickerSheet from '$lib/modules/Finance/components/AccountPickerSheet.svelte'
    import AccountBalanceCard from '$lib/modules/Finance/components/AccountBalanceCard.svelte'
    import AccountActions from '$lib/modules/Finance/components/AccountActions.svelte'
    import MovementsList from '$lib/modules/Finance/components/MovementsList.svelte'
    import AccountTransferSheet from '$lib/modules/Finance/components/AccountTransferSheet.svelte'
    import CashAdjustmentSheet from '$lib/modules/Finance/components/CashAdjustmentSheet.svelte'
    import WalletEditSheet from './WalletEditSheet.svelte'

    interface Props {
        wallets: WalletAccount[]
        selected: WalletAccount
        movements: FinancialMovement[]
        isLoadingMovements: boolean
        canManage: boolean
        canAdjust: boolean
        onSelect: (id: number) => void
    }
    let { wallets, selected, movements, isLoadingMovements, canManage, canAdjust, onSelect }: Props =
        $props()

    let pickerOpen = $state(false)
    let editOpen = $state(false)
    let transferOpen = $state(false)
    let adjustOpen = $state(false)

    const pickerItems = $derived(
        wallets.map((w) => ({ id: w.id, name: w.name, balance: w.balance }))
    )
</script>

<div class="flex flex-col gap-4">
    <AccountSelectorButton
        name={selected.name}
        subtitle="Billetera"
        balance={selected.balance}
        icon={Wallet}
        selectable={wallets.length > 1}
        onclick={() => (pickerOpen = true)}
    />

    <div class="grid gap-4 md:grid-cols-[minmax(0,360px)_1fr] md:items-start md:gap-5">
        <div class="flex flex-col gap-4">
            <AccountBalanceCard
                name={selected.name}
                subtitle="Billetera"
                balance={selected.balance}
                {movements}
                icon={Wallet}
            />
            <AccountActions
                {canManage}
                {canAdjust}
                onTransfer={() => (transferOpen = true)}
                onAdjust={() => (adjustOpen = true)}
                onEdit={() => (editOpen = true)}
            />
        </div>

        <MovementsList
            {movements}
            isLoading={isLoadingMovements}
            subtitle="Historial de transacciones de esta billetera"
        />
    </div>
</div>

<AccountPickerSheet
    open={pickerOpen}
    title="Selecciona billetera"
    items={pickerItems}
    selectedId={selected.id}
    icon={Wallet}
    {onSelect}
    onClose={() => (pickerOpen = false)}
/>

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
