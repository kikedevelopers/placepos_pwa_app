<script lang="ts">
    import { formatCurrency, formatNumber } from '$lib/utils/numbers'
    import { getErrorMessage } from '$lib/utils/errors'
    import { useBranchesSummary } from '$lib/hooks/useBranchesSummary'
    import type { BranchSummaryRow } from '$lib/api/requests/dashboard'
    import DashCard from './ui/DashCard.svelte'
    import { TONE_TEXT, type MetricTone } from './ui/tones'
    import CardState from './ui/CardState.svelte'

    const query = useBranchesSummary()
    const data = $derived($query.data)

    type Row = Pick<BranchSummaryRow, 'name' | 'sales' | 'profit' | 'margin' | 'expenses' | 'total'> & {
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

<!-- Montos sin "…": si no caben bajan de línea; el margen va en su propia línea. -->
{#snippet metric(label: string, value: number, tone: MetricTone, hint?: string)}
    <div class="min-w-0">
        <dt class="text-[11.5px] text-muted-foreground">{label}</dt>
        <dd class="mt-0.5 text-[13px] font-medium tabular-nums [overflow-wrap:anywhere] {TONE_TEXT[tone]}">
            {formatCurrency(value)}
        </dd>
        {#if hint}<dd class="text-[11px] tabular-nums text-muted-foreground">{hint}</dd>{/if}
    </div>
{/snippet}

{#snippet branch(row: Row, isTotal: boolean)}
    <div class="py-3 {isTotal ? '-mx-3 rounded-2xl bg-muted/70 px-3' : ''}">
        <div class="flex items-baseline justify-between gap-3">
            <p class="flex min-w-0 items-baseline gap-2">
                <span class="truncate text-[14px] text-foreground {isTotal ? 'font-semibold' : 'font-medium'}">
                    {row.name}
                </span>
                {#if row.tag}
                    <span
                        class="shrink-0 rounded-full px-1.5 py-px text-[10.5px] font-medium {row.tag === 'Sucursal'
                            ? 'bg-muted text-muted-foreground'
                            : 'bg-primary/10 text-primary'}"
                    >
                        {row.tag}
                    </span>
                {/if}
            </p>
            <span
                class="shrink-0 font-semibold tabular-nums tracking-[-0.01em] {isTotal
                    ? 'text-[16px]'
                    : 'text-[14px]'} {row.total >= 0 ? 'text-success' : 'text-destructive'}"
            >
                {formatCurrency(row.total)}
            </span>
        </div>
        <dl class="mt-2 grid grid-cols-3 gap-3">
            {@render metric('Ventas', row.sales, 'neutral')}
            {@render metric('Ganancia', row.profit, row.profit < 0 ? 'liability' : 'asset', `${formatNumber(row.margin, 1)}%`)}
            {@render metric('Gastos', row.expenses, 'liability')}
        </dl>
    </div>
{/snippet}

{#if $query.isLoading}
    <CardState title="Sucursales hoy" status="loading" rows={4} />
{:else if $query.isError || !data}
    <CardState
        title="Sucursales hoy"
        status="error"
        message={getErrorMessage($query.error) ?? 'No se pudo cargar el resumen por sucursal.'}
        onRetry={() => $query.refetch()}
    />
{:else}
    <DashCard title="Sucursales hoy" description="Venta menos gastos de cada negocio">
        <div class="-mt-1 divide-y divide-border/60">
            {#each data.rows as row (row.companyId)}
                {@render branch(toRow(row), false)}
            {/each}
        </div>
        <div class="mt-2">
            {@render branch({ ...data.totals, name: 'Total', tag: null }, true)}
        </div>
    </DashCard>
{/if}
