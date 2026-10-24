<script lang="ts">
    import { Landmark, Monitor, Receipt, Wallet } from '@lucide/svelte'
    import type { ExpenseRecord, ExpenseSourceType } from '$lib/api/requests/expenses'
    import { Money, Pill } from '$lib/components/premium'
    import { cn } from '$lib/utils'
    import { sourceLabel } from '../../utils/expenseRows'

    /**
     * Un gasto variable dentro de la lista agrupada por día. Si el rol puede
     * anular y el gasto sigue vigente, tocarlo abre la confirmación.
     */
    interface Props {
        expense: ExpenseRecord
        onclick?: () => void
    }
    let { expense, onclick }: Props = $props()

    const ICONS: Record<ExpenseSourceType, typeof Wallet> = {
        wallet: Wallet,
        bank: Landmark,
        cash_register: Monitor
    }
    const Icon = $derived(ICONS[expense.source_type] ?? Receipt)
    const voided = $derived(expense.is_archived)
    const detail = $derived([sourceLabel(expense), expense.created_by].filter(Boolean).join(' · '))
</script>

<button
    type="button"
    {onclick}
    disabled={!onclick}
    aria-label={`${expense.description}${voided ? ', anulado' : ''}`}
    class="row flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-100 active:bg-foreground/[0.05] disabled:active:bg-transparent"
>
    <span
        class={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
            voided ? 'bg-foreground/[0.05] text-muted-foreground' : 'bg-destructive/10 text-destructive'
        )}
    >
        <Icon size={18} strokeWidth={2} />
    </span>
    <span class="min-w-0 flex-1">
        <span class={cn('block truncate text-[15px] font-medium', voided ? 'text-muted-foreground line-through' : 'text-foreground')}>
            {expense.description}
        </span>
        <span class="mt-0.5 block truncate text-[12.5px] text-muted-foreground">{detail}</span>
    </span>
    <span class="flex shrink-0 flex-col items-end gap-1">
        <span class={cn('inline-flex items-baseline text-[15.5px] font-semibold', voided ? 'text-muted-foreground line-through' : 'text-foreground')}>
            −<Money value={expense.amount} />
        </span>
        {#if voided}<Pill label="Anulado" tone="muted" />{/if}
    </span>
</button>
