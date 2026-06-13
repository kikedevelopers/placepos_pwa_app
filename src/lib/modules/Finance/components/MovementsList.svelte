<script lang="ts">
    import { ArrowDownLeft, ArrowUpRight, CalendarRange, CalendarX2, ListFilter, Scale } from '@lucide/svelte'
    import type { FinancialMovement } from '$lib/api/requests/financial-movements/types'
    import { formatCurrency } from '$lib/utils/numbers'
    import { formatDateTime } from '$lib/utils/dates'
    import { conceptLabel, isPositiveMovement } from '../constants/concepts'
    import { PRESET_LABELS, type RangePreset } from '../utils/movementsRange'
    import type { MovementsRange } from '../hooks/useMovementsRange.svelte'
    import MovementsConceptSheet from './MovementsConceptSheet.svelte'
    import Spinner from '$lib/components/Spinner.svelte'

    interface Props {
        movements: FinancialMovement[]
        isLoading: boolean
        range: MovementsRange
    }
    let { movements, isLoading, range }: Props = $props()

    const PRESETS: RangePreset[] = ['today', 'yesterday', 'last7', 'thisMonth']

    let conceptSheetOpen = $state(false)
    let concepts = $state<string[]>([])

    const available = $derived([...new Set(movements.map((m) => m.concept))])
    const displayed = $derived(
        concepts.length ? movements.filter((m) => concepts.includes(m.concept)) : movements
    )
    const conceptFiltered = $derived(concepts.length > 0)

    // Total (neto) por cada concepto seleccionado, para verlos por separado.
    const conceptTotals = $derived(
        concepts
            .map((concept) => {
                const items = displayed.filter((m) => m.concept === concept)
                const total = items.reduce(
                    (sum, m) => sum + (isPositiveMovement(m.movement_type) ? m.amount : -m.amount),
                    0
                )
                return { concept, count: items.length, total }
            })
            .filter((t) => t.count > 0)
    )
</script>

<div class="overflow-hidden rounded-2xl border border-border bg-card">
    <div class="flex flex-col gap-3 border-b border-border/60 px-5 py-4">
        <div class="flex items-start justify-between gap-3">
            <div>
                <h3 class="text-sm font-semibold text-foreground">Movimientos</h3>
                <p class="mt-0.5 text-[11px] text-muted-foreground">
                    Mostrando <span class="font-medium text-foreground/70">{range.label}</span>
                </p>
            </div>
            <button
                type="button"
                onclick={() => (conceptSheetOpen = true)}
                disabled={available.length === 0}
                class="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-[transform,background-color] duration-150 ease-out active:scale-[0.97] disabled:opacity-40 {conceptFiltered
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-border bg-card text-muted-foreground'}"
            >
                <ListFilter size={14} />
                {conceptFiltered ? `Tipo · ${concepts.length}` : 'Tipo'}
            </button>
        </div>

        <!-- Chips de rango de fechas -->
        <div class="-mx-1 flex items-center gap-1.5 overflow-x-auto px-1 pb-0.5">
            {#each PRESETS as preset (preset)}
                {@const active = range.mode === preset}
                <button
                    type="button"
                    onclick={() => range.setPreset(preset)}
                    class="shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-[transform,background-color] duration-150 ease-out active:scale-[0.97] {active
                        ? 'border-primary/40 bg-primary/10 text-primary'
                        : 'border-border bg-card text-muted-foreground'}"
                >
                    {PRESET_LABELS[preset]}
                </button>
            {/each}
            <button
                type="button"
                onclick={() => range.setCustom(range.customFrom, range.customTo)}
                class="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-[transform,background-color] duration-150 ease-out active:scale-[0.97] {range.mode ===
                'custom'
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-border bg-card text-muted-foreground'}"
            >
                <CalendarRange size={14} />
                Personalizado
            </button>
        </div>

        {#if range.mode === 'custom'}
            <div class="grid grid-cols-2 gap-3">
                <label class="flex flex-col gap-1">
                    <span class="text-[11px] font-medium text-muted-foreground">Desde</span>
                    <input
                        type="date"
                        value={range.customFrom}
                        max={range.customTo}
                        onchange={(e) => range.setCustom(e.currentTarget.value, range.customTo)}
                        class="h-9 rounded-lg border border-border bg-card px-2.5 text-sm text-foreground outline-none focus:border-primary"
                    />
                </label>
                <label class="flex flex-col gap-1">
                    <span class="text-[11px] font-medium text-muted-foreground">Hasta</span>
                    <input
                        type="date"
                        value={range.customTo}
                        min={range.customFrom}
                        onchange={(e) => range.setCustom(range.customFrom, e.currentTarget.value)}
                        class="h-9 rounded-lg border border-border bg-card px-2.5 text-sm text-foreground outline-none focus:border-primary"
                    />
                </label>
            </div>
        {/if}
    </div>

    {#if conceptFiltered && conceptTotals.length > 0}
        <div class="flex flex-wrap gap-2 border-b border-border/50 bg-muted/30 px-5 py-3">
            {#each conceptTotals as t (t.concept)}
                <div class="rounded-xl border border-border/60 bg-card px-3.5 py-2">
                    <p class="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        {conceptLabel(t.concept)} · {t.count}
                    </p>
                    <p
                        class="text-sm font-bold tabular-nums {t.total >= 0
                            ? 'text-success'
                            : 'text-destructive'}"
                    >
                        {t.total >= 0 ? '+' : '-'}{formatCurrency(Math.abs(t.total))}
                    </p>
                </div>
            {/each}
        </div>
    {/if}

    {#if isLoading}
        <div class="flex items-center justify-center py-12">
            <Spinner size={20} color="hsl(215, 16%, 55%)" />
        </div>
    {:else if displayed.length > 0}
        <ul class="divide-y divide-border/50">
            {#each displayed as movement (movement.id)}
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
                            {formatDateTime(movement.created_at)}
                        </p>
                    </div>
                </li>
            {/each}
        </ul>
    {:else}
        <div class="flex flex-col items-center justify-center px-8 py-12 text-center">
            <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60">
                <CalendarX2 size={20} color="hsl(215, 16%, 65%)" strokeWidth={1.8} />
            </div>
            <p class="text-sm font-medium text-muted-foreground">Sin movimientos</p>
            <p class="mt-1 text-xs text-muted-foreground/70">
                {conceptFiltered
                    ? 'No hay movimientos de los tipos seleccionados en este periodo'
                    : `No hay movimientos en el periodo seleccionado (${range.label.toLowerCase()})`}
            </p>
        </div>
    {/if}
</div>

<MovementsConceptSheet
    open={conceptSheetOpen}
    {available}
    selected={concepts}
    onChange={(next) => (concepts = next)}
    onClose={() => (conceptSheetOpen = false)}
/>
