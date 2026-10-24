<script lang="ts">
    import { Landmark } from '@lucide/svelte'
    import type { BankAccount } from '$lib/api/requests/banks'
    import AccountCarousel from '$lib/modules/Finance/components/AccountCarousel.svelte'
    import AccountActions from '$lib/modules/Finance/components/AccountActions.svelte'
    import MovementsList from '$lib/modules/Finance/components/MovementsList.svelte'
    import AccountTransferSheet from '$lib/modules/Finance/components/AccountTransferSheet.svelte'
    import CashAdjustmentSheet from '$lib/modules/Finance/components/CashAdjustmentSheet.svelte'
    import { useMovementsRange } from '$lib/modules/Finance/hooks/useMovementsRange.svelte'
    import { ACCOUNT_TYPE_LABELS } from '../schemas/bank.schema'
    import { useBankMovements } from '../hooks/useBankMovements'
    import BankEditSheet from './BankEditSheet.svelte'

    interface Props {
        banks: BankAccount[]
        selected: BankAccount
        canManage: boolean
        canAdjust: boolean
        onSelect: (id: number) => void
    }
    let { banks, selected, canManage, canAdjust, onSelect }: Props = $props()

    const range = useMovementsRange()
    const movementsQuery = useBankMovements(
        () => selected.id,
        () => range.range
    )
    const movements = $derived($movementsQuery.data ?? [])

    let editOpen = $state(false)
    let transferOpen = $state(false)
    let adjustOpen = $state(false)

    const subtitleOf = (bank: BankAccount): string =>
        `${ACCOUNT_TYPE_LABELS[bank.account_type]} · ${bank.account_number}`

    const cards = $derived(
        banks.map((b) => ({
            id: b.id,
            name: b.name,
            subtitle: subtitleOf(b),
            balance: b.balance,
            badge: b.available_in_pos ? 'POS' : null
        }))
    )
</script>

<div class="flex flex-col gap-6">
    <AccountCarousel kind="bank" icon={Landmark} accounts={cards} selectedId={selected.id} {onSelect} />
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
