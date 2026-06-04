<script lang="ts">
    import { CreditCard, Landmark } from '@lucide/svelte'
    import type { BankAccount } from '$lib/api/requests/banks'
    import type { FinancialMovement } from '$lib/api/requests/financial-movements/types'
    import AccountSelectorButton from '$lib/modules/Finance/components/AccountSelectorButton.svelte'
    import AccountPickerSheet from '$lib/modules/Finance/components/AccountPickerSheet.svelte'
    import AccountBalanceCard from '$lib/modules/Finance/components/AccountBalanceCard.svelte'
    import AccountActions from '$lib/modules/Finance/components/AccountActions.svelte'
    import MovementsList from '$lib/modules/Finance/components/MovementsList.svelte'
    import AccountTransferSheet from '$lib/modules/Finance/components/AccountTransferSheet.svelte'
    import CashAdjustmentSheet from '$lib/modules/Finance/components/CashAdjustmentSheet.svelte'
    import { ACCOUNT_TYPE_LABELS } from '../schemas/bank.schema'
    import BankEditSheet from './BankEditSheet.svelte'

    interface Props {
        banks: BankAccount[]
        selected: BankAccount
        movements: FinancialMovement[]
        isLoadingMovements: boolean
        canManage: boolean
        canAdjust: boolean
        onSelect: (id: number) => void
    }
    let { banks, selected, movements, isLoadingMovements, canManage, canAdjust, onSelect }: Props =
        $props()

    let pickerOpen = $state(false)
    let editOpen = $state(false)
    let transferOpen = $state(false)
    let adjustOpen = $state(false)

    const subtitleOf = (bank: BankAccount): string =>
        `${ACCOUNT_TYPE_LABELS[bank.account_type]} · ${bank.account_number}`

    const pickerItems = $derived(
        banks.map((b) => ({
            id: b.id,
            name: b.name,
            subtitle: subtitleOf(b),
            balance: b.balance
        }))
    )
</script>

<div class="flex flex-col gap-4">
    <AccountSelectorButton
        name={selected.name}
        subtitle={subtitleOf(selected)}
        balance={selected.balance}
        icon={Landmark}
        selectable={banks.length > 1}
        onclick={() => (pickerOpen = true)}
    />

    <div class="grid gap-4 md:grid-cols-[minmax(0,360px)_1fr] md:items-start md:gap-5">
        <div class="flex flex-col gap-4">
            <AccountBalanceCard
                name={selected.name}
                subtitle={subtitleOf(selected)}
                subtitleMono
                subtitleIcon={CreditCard}
                balance={selected.balance}
                {movements}
                icon={Landmark}
                badge={selected.available_in_pos ? 'POS activo' : null}
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
            subtitle="Historial de transacciones de esta cuenta"
        />
    </div>
</div>

<AccountPickerSheet
    open={pickerOpen}
    title="Selecciona cuenta"
    items={pickerItems}
    selectedId={selected.id}
    icon={Landmark}
    {onSelect}
    onClose={() => (pickerOpen = false)}
/>

{#if editOpen}
    <BankEditSheet bank={selected} onClose={() => (editOpen = false)} />
{/if}

{#if transferOpen}
    <AccountTransferSheet
        source={{ type: 'bank', id: selected.id, name: selected.name, balance: selected.balance }}
        onClose={() => (transferOpen = false)}
    />
{/if}

{#if adjustOpen}
    <CashAdjustmentSheet
        target={{ kind: 'bank', id: selected.id, name: selected.name, balance: selected.balance }}
        onClose={() => (adjustOpen = false)}
    />
{/if}
