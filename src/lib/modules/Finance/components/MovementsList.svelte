<script lang="ts">
    import { ArrowDownLeft, ArrowUpRight, Scale } from '@lucide/svelte'
    import type { FinancialMovement } from '$lib/api/requests/financial-movements/types'
    import { formatCurrency } from '$lib/utils/numbers'
    import { formatShortDate } from '$lib/utils/dates'
    import { conceptLabel, isPositiveMovement } from '../constants/concepts'
    import Spinner from '$lib/components/Spinner.svelte'

    interface Props {
        movements: FinancialMovement[]
        isLoading: boolean
        /** Texto secundario del encabezado (varía entre billetera y cuenta). */
        subtitle?: string
    }
    let { movements, isLoading, subtitle = 'Historial de transacciones de esta cuenta' }: Props =
        $props()
</script>

<div class="overflow-hidden rounded-2xl border border-border bg-card">
    <div class="border-b border-border/60 px-5 py-4">
        <h3 class="text-sm font-semibold text-foreground">Movimientos</h3>
        <p class="mt-0.5 text-[11px] text-muted-foreground">{subtitle}</p>
    </div>

    {#if isLoading}
        <div class="flex items-center justify-center py-12">
            <Spinner size={20} color="hsl(215, 16%, 55%)" />
        </div>
    {:else if movements.length > 0}
        <ul class="divide-y divide-border/50">
            {#each movements as movement (movement.id)}
                {@const positive = isPositiveMovement(movement.movement_type)}
                {@const adjustment = movement.concept === 'ADJUSTMENT'}
                <li class="flex items-center gap-3.5 px-5 py-3.5">
                    <span
                        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl {adjustment
                            ? 'bg-violet-500/15'
                            : positive
                              ? 'bg-success/15'
                              : 'bg-destructive/15'}"
                    >
                        {#if adjustment}
                            <Scale size={16} color="hsl(258, 90%, 66%)" strokeWidth={2} />
                        {:else if positive}
                            <ArrowDownLeft size={16} color="hsl(158, 64%, 42%)" strokeWidth={2.2} />
                        {:else}
                            <ArrowUpRight size={16} color="hsl(0, 84%, 55%)" strokeWidth={2.2} />
                        {/if}
                    </span>

                    <div class="min-w-0 flex-1">
                        <p class="text-sm font-medium text-foreground">
                            {conceptLabel(movement.concept)}
                        </p>
                        {#if movement.description}
                            <p class="truncate text-[11px] text-muted-foreground">
                                {movement.description}
                            </p>
                        {/if}
                    </div>

                    <div class="shrink-0 text-right">
                        <p
                            class="text-sm font-bold tabular-nums {positive
                                ? 'text-success'
                                : 'text-destructive'}"
                        >
                            {positive ? '+' : '-'}{formatCurrency(movement.amount)}
                        </p>
                        <p class="text-[10px] text-muted-foreground">
                            {formatShortDate(movement.created_at)}
                        </p>
                    </div>
                </li>
            {/each}
        </ul>
    {:else}
        <div class="flex flex-col items-center justify-center px-8 py-12 text-center">
            <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60">
                <ArrowUpRight size={20} color="hsl(215, 16%, 65%)" strokeWidth={1.8} />
            </div>
            <p class="text-sm font-medium text-muted-foreground">Sin movimientos</p>
            <p class="mt-1 text-xs text-muted-foreground/70">
                Los movimientos de esta cuenta aparecerán aquí
            </p>
        </div>
    {/if}
</div>
