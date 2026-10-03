<script lang="ts">
    import { AlertTriangle, Store } from '@lucide/svelte'
    import { formatCurrency, formatNumber } from '$lib/utils/numbers'
    import { getErrorMessage } from '$lib/utils/errors'
    import { useBranchesSummary } from '$lib/hooks/useBranchesSummary'
    import type { BranchSummaryRow } from '$lib/api/requests/dashboard'
    import Spinner from '$lib/components/Spinner.svelte'

    const CARD = 'rounded-2xl border border-border bg-card p-5'
    const SHADOW = 'box-shadow:0 8px 14px hsla(222,47%,11%,0.05)'

    const query = useBranchesSummary()
    const data = $derived($query.data)

    type Row = {
        name: string
        sales: number
        profit: number
        margin: number
        expenses: number
        total: number
        tag: 'Principal' | 'Sucursal' | null
    }

    const toRow = (r: BranchSummaryRow): Row => ({
        name: r.name,
        sales: r.sales,
        profit: r.profit,
        margin: r.margin,
        expenses: r.expenses,
        total: r.total,
        tag: r.isBranch ? 'Sucursal' : 'Principal'
    })
</script>

{#snippet metric(label: string, value: number, tone: 'neutral' | 'profit' | 'expense', hint?: string)}
    <div class="flex min-w-0 flex-col gap-0.5">
        <span class="text-[10px] uppercase tracking-wide text-muted-foreground/60">{label}</span>
        <span
            class="text-[11px] font-semibold leading-none tabular-nums {tone === 'profit'
                ? 'text-success'
                : tone === 'expense'
                  ? 'text-destructive'
                  : 'text-foreground'}"
        >
            {formatCurrency(value)}
        </span>
        {#if hint}
            <span class="text-[10px] tabular-nums text-muted-foreground/60">{hint}</span>
        {/if}
    </div>
{/snippet}

{#snippet branchBlock(row: Row, isTotal: boolean)}
    <div class="py-2.5 {isTotal ? 'rounded-lg bg-primary/[0.06] px-2.5' : 'px-1'}">
        <div class="flex items-center justify-between gap-2">
            <span class="flex min-w-0 items-center gap-1.5">
                <span
                    class="truncate {isTotal
                        ? 'text-[11px] font-bold uppercase tracking-wide text-muted-foreground'
                        : 'text-[13px] font-medium text-foreground'}"
                >
                    {row.name}
                </span>
                {#if !isTotal && row.tag}
                    <span
                        class="shrink-0 text-[9px] font-semibold uppercase tracking-wide {row.tag ===
                        'Sucursal'
                            ? 'text-muted-foreground/60'
                            : 'text-primary/70'}"
                    >
                        {row.tag}
                    </span>
                {/if}
            </span>
            <span class="flex shrink-0 flex-col items-end leading-none">
                {#if !isTotal}
                    <span class="text-[9px] uppercase tracking-wide text-muted-foreground/50">
                        Total
                    </span>
                {/if}
                <span
                    class="tabular-nums {isTotal
                        ? 'text-sm font-bold'
                        : 'text-[13px] font-semibold'} {row.total >= 0
                        ? 'text-success'
                        : 'text-destructive'}"
                >
                    {formatCurrency(row.total)}
                </span>
            </span>
        </div>

        <div class="mt-2 grid grid-cols-3 gap-2">
            {@render metric('Ventas', row.sales, 'neutral')}
            {@render metric('Ganancia', row.profit, 'profit', `${formatNumber(row.margin, 1)}%`)}
            {@render metric('Gastos', row.expenses, 'expense')}
        </div>
    </div>
{/snippet}

{#if $query.isLoading}
    <div class="{CARD} flex min-h-[160px] items-center justify-center" style={SHADOW}>
        <Spinner />
    </div>
{:else if $query.isError || !data}
    <div class="{CARD} flex items-center gap-3" style={SHADOW}>
        <AlertTriangle size={18} color="hsl(32, 95%, 44%)" strokeWidth={2} />
        <p class="flex-1 text-xs leading-4 text-muted-foreground">
            {getErrorMessage($query.error) ?? 'No se pudo cargar el resumen por sucursal.'}
        </p>
    </div>
{:else}
    <div class={CARD} style={SHADOW}>
        <div class="mb-3 flex items-center gap-2.5">
            <div
                class="flex h-8 w-8 items-center justify-center rounded-lg"
                style="background-color: hsla(217, 91%, 50%, 0.15)"
            >
                <Store size={14} color="hsl(217, 91%, 50%)" strokeWidth={2} />
            </div>
            <div class="min-w-0">
                <p class="text-sm font-semibold leading-tight text-foreground">
                    Resumen por sucursal
                </p>
                <p class="mt-0.5 text-[11px] leading-tight text-muted-foreground">
                    Ventas, ganancia y gastos de hoy
                </p>
            </div>
        </div>

        <div class="divide-y divide-border/50">
            {#each data.rows as row (row.companyId)}
                {@render branchBlock(toRow(row), false)}
            {/each}
        </div>

        <div class="mt-2 border-t border-border pt-2">
            {@render branchBlock({ ...data.totals, name: 'Total', tag: null }, true)}
        </div>
    </div>
{/if}
