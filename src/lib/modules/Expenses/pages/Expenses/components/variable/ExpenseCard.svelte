<script lang="ts">
    import { Ban, Landmark, Monitor, Receipt, Wallet } from '@lucide/svelte'
    import type { ExpenseRecord, ExpenseSourceType } from '$lib/api/requests/expenses'
    import { formatCurrency } from '$lib/utils/numbers'
    import { formatShortDate } from '$lib/utils/dates'
    import PressableScale from '$lib/components/PressableScale.svelte'

    interface Props {
        expense: ExpenseRecord
        /** Solo el owner ve el botón de anular (la regla la reimpone el backend). */
        canVoid: boolean
        voiding: boolean
        onVoid: (expense: ExpenseRecord) => void
    }
    let { expense, canVoid, voiding, onVoid }: Props = $props()

    const ICONS: Record<ExpenseSourceType, typeof Wallet> = {
        wallet: Wallet,
        bank: Landmark,
        cash_register: Monitor
    }
    const LABELS: Record<ExpenseSourceType, string> = {
        wallet: 'Billetera',
        bank: 'Banco',
        cash_register: 'Caja'
    }

    const isVoided = $derived(expense.is_archived)
    const Icon = $derived(ICONS[expense.source_type] ?? Receipt)
    const sourceLabel = $derived(
        [LABELS[expense.source_type], expense.source_name].filter(Boolean).join(': ')
    )
    const DANGER = 'hsl(0, 84%, 55%)'
</script>

<div
    class="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 {isVoided
        ? 'opacity-60'
        : ''}"
    style="box-shadow:0 4px 10px hsla(222,47%,11%,0.04)"
>
    <div
        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
        style="background-color:{isVoided ? 'hsla(215, 16%, 55%, 0.12)' : 'hsla(0, 84%, 55%, 0.10)'}"
    >
        <Icon
            size={20}
            color={isVoided ? 'hsl(215, 16%, 55%)' : DANGER}
            strokeWidth={2}
        />
    </div>

    <div class="min-w-0 flex-1">
        <p
            class="truncate text-sm font-semibold {isVoided
                ? 'text-muted-foreground line-through'
                : 'text-foreground'}"
        >
            {expense.description}
        </p>
        <p class="mt-0.5 truncate text-[11px] text-muted-foreground">
            {sourceLabel}{#if expense.created_by}
                <span class="text-muted-foreground/60"> · {expense.created_by}</span>
            {/if}
        </p>
        <p class="mt-0.5 text-[11px] text-muted-foreground/70">
            {formatShortDate(expense.expense_date ?? expense.created_at)}
        </p>
    </div>

    <div class="flex shrink-0 flex-col items-end gap-1.5">
        <p
            class="text-sm font-bold tabular-nums {isVoided
                ? 'text-muted-foreground line-through'
                : 'text-destructive'}"
        >
            -{formatCurrency(expense.amount)}
        </p>

        {#if isVoided}
            <span
                class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold text-muted-foreground"
                style="background-color:hsla(215, 16%, 55%, 0.14)"
            >
                Anulado
            </span>
        {:else if canVoid}
            <PressableScale
                onclick={() => onVoid(expense)}
                disabled={voiding}
                ariaLabel="Anular gasto"
                class="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background"
                style="color:hsl(215, 16%, 47%)"
            >
                <Ban size={16} color="hsl(215, 16%, 47%)" strokeWidth={2} />
            </PressableScale>
        {/if}
    </div>
</div>
