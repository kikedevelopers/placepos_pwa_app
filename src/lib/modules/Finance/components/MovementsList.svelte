<script lang="ts">
    import { ArrowDownLeft, ArrowUpRight, CalendarRange, CalendarX2, ListFilter, Scale } from '@lucide/svelte'
    import type { FinancialMovement } from '$lib/api/requests/financial-movements/types'
    import { EmptyState, Metrics, Segmented, SkeletonList, ToolbarChip, groupByDay, timeLabel } from '$lib/components/premium'
    import { cn } from '$lib/utils'
    import { formatCurrency } from '$lib/utils/numbers'
    import { conceptLabel, isPositiveMovement } from '../constants/concepts'
    import type { RangePreset } from '../utils/movementsRange'
    import type { MovementsRange } from '../hooks/useMovementsRange.svelte'
    import { movementTotals } from '../utils/accountScreen'
    import MovementsConceptSheet from './MovementsConceptSheet.svelte'

    /**
     * Movimientos de la cuenta: periodo (segmentado + rango propio), entradas y
     * salidas del periodo, filtro por tipo y la lista agrupada por día.
     */
    interface Props {
        movements: FinancialMovement[]
        isLoading: boolean
        range: MovementsRange
    }
    let { movements, isLoading, range }: Props = $props()

    const PRESET_OPTIONS = [
        { value: 'today', label: 'Hoy' },
        { value: 'yesterday', label: 'Ayer' },
        { value: 'last7', label: '7 días' },
        { value: 'thisMonth', label: 'Mes' }
    ] as const satisfies readonly { value: RangePreset; label: string }[]

    let conceptSheetOpen = $state(false)
    let concepts = $state<string[]>([])

    const available = $derived([...new Set(movements.map((m) => m.concept))])
    const displayed = $derived(concepts.length ? movements.filter((m) => concepts.includes(m.concept)) : movements)
    const totals = $derived(movementTotals(displayed))
    const groups = $derived(groupByDay(displayed, (m) => m.created_at))
    const customOpen = $derived(range.mode === 'custom')
    const DATE_INPUT =
        'h-10 w-full rounded-[12px] bg-foreground/[0.055] px-3 text-[14px] tabular-nums text-foreground outline-none focus:bg-card focus:shadow-[0_0_0_1.5px_hsl(var(--primary)/0.55)]'
</script>

<section class="flex flex-col gap-3" aria-label="Movimientos">
    <div class="flex items-end justify-between gap-3 px-1">
        <div>
            <h3 class="text-[17px] font-semibold tracking-[-0.015em] text-foreground">Movimientos</h3>
            <p class="text-[12.5px] text-muted-foreground">{range.label}</p>
        </div>
        <div class="flex items-center gap-2">
            <ToolbarChip
                icon={ListFilter}
                label="Tipo"
                count={concepts.length || undefined}
                active={concepts.length > 0}
                onclick={() => (conceptSheetOpen = true)}
            />
        </div>
    </div>

    <div class="flex items-center gap-2">
        <Segmented
            class="flex-1"
            ariaLabel="Periodo de los movimientos"
            options={PRESET_OPTIONS}
            value={(customOpen ? '' : range.mode) as RangePreset}
            onChange={(v) => range.setPreset(v)}
        />
        <button
            type="button"
            aria-label="Rango personalizado"
            aria-pressed={customOpen}
            onclick={() => range.setCustom(range.customFrom, range.customTo)}
            class={cn(
                'flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[12px] transition-[background-color,transform] duration-150 active:scale-[0.94]',
                customOpen ? 'bg-primary/10 text-primary' : 'bg-foreground/[0.06] text-muted-foreground'
            )}
        >
            <CalendarRange size={17} strokeWidth={2.1} />
        </button>
    </div>

    {#if customOpen}
        <div class="grid grid-cols-2 gap-2">
            <label class="flex flex-col gap-1">
                <span class="text-[12px] text-muted-foreground">Desde</span>
                <input type="date" value={range.customFrom} max={range.customTo} onchange={(e) => range.setCustom(e.currentTarget.value, range.customTo)} class={DATE_INPUT} />
            </label>
            <label class="flex flex-col gap-1">
                <span class="text-[12px] text-muted-foreground">Hasta</span>
                <input type="date" value={range.customTo} min={range.customFrom} onchange={(e) => range.setCustom(range.customFrom, e.currentTarget.value)} class={DATE_INPUT} />
            </label>
        </div>
    {/if}

    <Metrics
        ariaLabel="Entradas y salidas del periodo"
        loading={isLoading}
        items={[
            { label: 'Entradas', amount: totals.income, tone: totals.income > 0 ? 'positive' : 'neutral' },
            { label: 'Salidas', amount: totals.expense, tone: totals.expense > 0 ? 'negative' : 'neutral' }
        ]}
    />

    {#if isLoading}
        <SkeletonList rows={4} />
    {:else if displayed.length === 0}
        <EmptyState
            icon={CalendarX2}
            title="Sin movimientos"
            message={concepts.length ? 'No hay movimientos de los tipos elegidos en este periodo.' : `Nada registrado en ${range.label.toLowerCase()}.`}
        />
    {:else}
        <div class="flex flex-col gap-4">
            {#each groups as group (group.key)}
                <div>
                    <h4 class="mb-1.5 px-1 text-[13px] font-semibold text-muted-foreground">{group.label}</h4>
                    <div class="surface group-rows overflow-hidden">
                        {#each group.items as movement (movement.id)}
                            {@const positive = isPositiveMovement(movement.movement_type)}
                            {@const adjustment = movement.concept === 'ADJUSTMENT'}
                            <div class="row flex items-center gap-3 px-4 py-3">
                                <span
                                    class={cn(
                                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                                        adjustment ? 'bg-foreground/[0.06] text-foreground/70' : positive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                                    )}
                                >
                                    {#if adjustment}<Scale size={16} strokeWidth={2.1} />
                                    {:else if positive}<ArrowDownLeft size={16} strokeWidth={2.3} />
                                    {:else}<ArrowUpRight size={16} strokeWidth={2.3} />{/if}
                                </span>
                                <span class="min-w-0 flex-1">
                                    <span class="block truncate text-[14.5px] font-medium text-foreground">{conceptLabel(movement.concept)}</span>
                                    <span class="mt-0.5 block truncate text-[12px] text-muted-foreground">
                                        {timeLabel(movement.created_at)}{movement.description ? ` · ${movement.description}` : ''}
                                    </span>
                                </span>
                                <span class={cn('shrink-0 text-[15px] font-semibold tabular-nums', positive ? 'text-success' : 'text-foreground')}>
                                    {positive ? '+' : '−'}{formatCurrency(movement.amount)}
                                </span>
                            </div>
                        {/each}
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</section>

<MovementsConceptSheet
    open={conceptSheetOpen}
    {available}
    selected={concepts}
    onChange={(next) => (concepts = next)}
    onClose={() => (conceptSheetOpen = false)}
/>
