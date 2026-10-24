<script lang="ts">
    import { AlertTriangle, Archive, CalendarClock, Pencil } from '@lucide/svelte'
    import { Money, shortDate } from '$lib/components/premium'
    import { remainingLabel } from '../../utils/fixedExpenseTime'
    import type { FixedExpense } from '$lib/api/requests/fixedExpenses'
    import { labelForPeriod } from '$lib/modules/Expenses/constants/periodicity'
    import {
        computeAccrual,
        ratePerDay,
        ratePerHour
    } from '$lib/modules/Expenses/utils/accrual'

    interface Props {
        expense: FixedExpense
        /** Marca de tiempo del useLiveTick: redibuja el devengo en vivo. */
        now: Date
        /** Si el usuario puede gestionar (owner|manager): muestra acciones. */
        canManage: boolean
        onEdit: (expense: FixedExpense) => void
        onArchive: (expense: FixedExpense) => void
        archiving?: boolean
    }
    let { expense, now, canManage, onEdit, onArchive, archiving = false }: Props = $props()

    // Devengo recalculado en cada tick con Big.js (vía las utils del accrual).
    const snapshot = $derived(computeAccrual(expense, now))
    const perDay = $derived(Number(ratePerDay(expense, now).toFixed(2)))
    const perHour = $derived(Number(ratePerHour(expense, now).toFixed(2)))

    const progressPct = $derived(
        Math.min(100, Math.max(0, snapshot.currentPeriodProgress * 100))
    )
    const accruedNow = $derived(Number(snapshot.accruedInCurrentPeriod.toFixed(2)))

    const remaining = $derived(remainingLabel(snapshot.currentPeriodEnd, now))
    const startLabel = $derived(shortDate(expense.start_date))
</script>

<article class="surface overflow-hidden">
    <header class="flex items-start gap-3 px-4 pb-3 pt-4">
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-primary/10 text-primary">
            <CalendarClock size={18} strokeWidth={2.1} />
        </span>
        <span class="min-w-0 flex-1">
            <span class="block truncate text-[15.5px] font-semibold text-foreground">{expense.name}</span>
            <span class="mt-0.5 block truncate text-[12.5px] text-muted-foreground">
                {labelForPeriod(expense.period_quantity, expense.period_unit)}{expense.description ? ` · ${expense.description}` : ''}
            </span>
        </span>
        <Money value={expense.amount} decimals={0} class="shrink-0 text-[15.5px] font-semibold text-foreground" />
    </header>

    <!-- Devengo del periodo, en vivo -->
    <div class="px-4 pb-4">
        <div class="flex items-end justify-between gap-3">
            <div class="min-w-0">
                <p class="text-[12px] text-muted-foreground">Acumulado del periodo</p>
                <p class="mt-0.5 text-[24px] font-semibold leading-tight tracking-[-0.03em] text-foreground">
                    <Money value={accruedNow} decimals={0} />
                </p>
            </div>
            <span class="shrink-0 pb-1 text-[13px] font-semibold tabular-nums text-muted-foreground">{progressPct.toFixed(1)} %</span>
        </div>
        <div class="mt-2.5 h-2 overflow-hidden rounded-full bg-foreground/[0.07]">
            <div class="h-full rounded-full bg-primary transition-[width] duration-700 ease-out" style="width:{progressPct}%"></div>
        </div>
        <p class="mt-2 text-[12px] text-muted-foreground">{remaining} para el próximo corte</p>
    </div>

    {#if expense.pending_periods_count > 0}
        <div class="mx-4 mb-4 flex items-center gap-2.5 rounded-[14px] bg-warning/[0.12] px-3.5 py-3 text-warning">
            <AlertTriangle size={16} strokeWidth={2.2} class="shrink-0" />
            <span class="flex-1 text-[13px] font-semibold">
                {expense.pending_periods_count === 1 ? '1 corte pendiente' : `${expense.pending_periods_count} cortes pendientes`}
            </span>
            <Money value={expense.pending_periods_total} decimals={0} class="text-[14px] font-semibold" />
        </div>
    {/if}

    <dl class="grid grid-cols-3 border-t border-border/60">
        <div class="px-4 py-3">
            <dt class="text-[11.5px] text-muted-foreground">Por día</dt>
            <dd class="mt-0.5 text-[13.5px] font-semibold tabular-nums text-foreground"><Money value={perDay} decimals={0} /></dd>
        </div>
        <div class="border-l border-border/60 px-4 py-3">
            <dt class="text-[11.5px] text-muted-foreground">Por hora</dt>
            <dd class="mt-0.5 text-[13.5px] font-semibold tabular-nums text-foreground"><Money value={perHour} /></dd>
        </div>
        <div class="border-l border-border/60 px-4 py-3">
            <dt class="text-[11.5px] text-muted-foreground">Desde</dt>
            <dd class="mt-0.5 truncate text-[13.5px] font-semibold text-foreground">{startLabel}</dd>
        </div>
    </dl>

    {#if canManage}
        <div class="grid grid-cols-2 border-t border-border/60">
            <button
                type="button"
                onclick={() => onEdit(expense)}
                class="flex h-12 items-center justify-center gap-1.5 text-[14px] font-semibold text-primary transition-colors active:bg-foreground/[0.04]"
            >
                <Pencil size={15} strokeWidth={2.2} />
                Editar
            </button>
            <button
                type="button"
                onclick={() => onArchive(expense)}
                disabled={archiving}
                class="flex h-12 items-center justify-center gap-1.5 border-l border-border/60 text-[14px] font-semibold text-destructive transition-colors active:bg-foreground/[0.04] disabled:opacity-50"
            >
                <Archive size={15} strokeWidth={2.2} />
                Archivar
            </button>
        </div>
    {/if}
</article>
