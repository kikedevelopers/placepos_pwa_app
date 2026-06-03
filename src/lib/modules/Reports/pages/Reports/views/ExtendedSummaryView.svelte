<script lang="ts">
    import { Banknote, CalendarDays, Landmark, ShoppingCart, TrendingDown, Wallet } from '@lucide/svelte'
    import { formatCurrency } from '$lib/utils/numbers'
    import { getErrorMessage } from '$lib/utils/errors'
    import { useExtendedSummary } from '../hooks/useExtendedSummary'
    import { makeRange, rangeLabel, type DateRangeValue } from '../components/dateRange'
    import DateRangeSheet from '../components/DateRangeSheet.svelte'
    import ToolbarButton from '../components/ToolbarButton.svelte'
    import ReportState from '../components/ReportState.svelte'
    import SectionBlock from '../components/SectionBlock.svelte'
    import LineRow from '../components/LineRow.svelte'

    // Default "mes a la fecha", igual que placepos.
    let range = $state<DateRangeValue>(makeRange('month'))
    let rangeOpen = $state(false)

    const query = useExtendedSummary(() => ({ from: range.from, to: range.to }))
    const d = $derived($query.data)
</script>

<div class="flex flex-col gap-3 px-5 pb-8 pt-3">
    <div class="flex items-center gap-2">
        <ToolbarButton icon={CalendarDays} label={rangeLabel(range)} active onclick={() => (rangeOpen = true)} />
    </div>

    {#if $query.isLoading}
        <ReportState kind="loading" />
    {:else if $query.isError}
        <ReportState kind="error" message={getErrorMessage($query.error)} />
    {:else if d}
        <!-- Ganancia real (hero) -->
        <div
            class="rounded-2xl border border-border p-5"
            style="background:linear-gradient(135deg,hsla(158,64%,38%,0.10),hsla(158,64%,38%,0.02));box-shadow:0 6px 14px hsla(222,47%,11%,0.05)"
        >
            <p class="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Ganancia real del periodo
            </p>
            <p class="mt-1 text-3xl font-bold tracking-tight text-success">
                {formatCurrency(d.gananciaReal)}
            </p>
            <p class="mt-1 text-xs text-muted-foreground">
                Ganancia {formatCurrency(d.ventas.ganancia)} − gastos {formatCurrency(d.gastos.total)}
            </p>
        </div>

        <SectionBlock icon={Banknote} title="Ventas" accent="success">
            <LineRow label="Efectivo" value={formatCurrency(d.ventas.efectivo)} />
            <LineRow label="Pagos electrónicos" value={formatCurrency(d.ventas.electronico)} />
            <LineRow label="Créditos" value={formatCurrency(d.ventas.credito)} tone="warning" />
            <LineRow label="Total ventas" value={formatCurrency(d.ventas.total)} bold />
            <LineRow label="Ganancia" value={formatCurrency(d.ventas.ganancia)} tone="asset" />
            <LineRow label="Margen" value={`${d.ventas.margen.toFixed(1)}%`} tone="muted" />
        </SectionBlock>

        <SectionBlock icon={TrendingDown} title="Gastos" accent="destructive">
            <LineRow label="Gastos del periodo" value={formatCurrency(d.gastos.total)} tone="liability" bold />
        </SectionBlock>

        <SectionBlock icon={Wallet} title="Cartera de créditos" accent="warning">
            <LineRow label="Saldo pendiente" value={formatCurrency(d.cartera.balance)} tone="liability" bold />
            <LineRow label="Créditos abiertos" value={String(d.cartera.count)} tone="muted" />
        </SectionBlock>

        <SectionBlock icon={ShoppingCart} title="Compras" accent="info">
            <LineRow label="Total compras" value={formatCurrency(d.compras.total)} bold />
            <LineRow label="Saldos por pagar" value={formatCurrency(d.compras.saldosPorPagar)} tone="liability" />
            <LineRow label="Pagos electrónicos" value={formatCurrency(d.compras.pagosElectronicos)} />
            <LineRow label="Pagos en efectivo" value={formatCurrency(d.compras.pagosEfectivo)} />
            <LineRow
                label="Recibidas"
                value={formatCurrency(d.compras.recibidas.total)}
                hint={`${d.compras.recibidas.count} compra(s)`}
            />
            <LineRow
                label="No recibidas"
                value={formatCurrency(d.compras.noRecibidas.total)}
                tone="muted"
                hint={`${d.compras.noRecibidas.count} compra(s)`}
            />
            <LineRow label="Abonos a transportistas" value={formatCurrency(d.compras.abonosTransportistas)} />
            <LineRow
                label="Abonos transportistas pendientes"
                value={formatCurrency(d.compras.abonosTransportistasPendientes)}
                tone="muted"
            />
        </SectionBlock>

        <SectionBlock icon={Landmark} title="Saldos de cuentas" accent="primary">
            {#if d.cajas.registros.length}
                <p class="pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Cajas
                </p>
                {#each d.cajas.registros as c (c.id)}
                    <LineRow label={c.nombre} value={formatCurrency(c.balance)} indent />
                {/each}
            {/if}
            {#if d.cajas.bancos.length}
                <p class="pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Bancos
                </p>
                {#each d.cajas.bancos as b (b.id)}
                    <LineRow label={b.nombre} value={formatCurrency(b.balance)} indent />
                {/each}
            {/if}
            {#if d.cajas.wallets.length}
                <p class="pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Billeteras
                </p>
                {#each d.cajas.wallets as w (w.id)}
                    <LineRow label={w.nombre} value={formatCurrency(w.balance)} indent />
                {/each}
            {/if}
            <div class="mt-1 border-t border-border/60 pt-1">
                <LineRow label="Total en cuentas" value={formatCurrency(d.cajas.totales.total)} bold tone="primary" />
            </div>
        </SectionBlock>
    {/if}
</div>

<DateRangeSheet
    open={rangeOpen}
    value={range}
    onClose={() => (rangeOpen = false)}
    onApply={(v) => (range = v)}
/>
