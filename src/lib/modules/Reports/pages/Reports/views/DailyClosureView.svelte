<script lang="ts">
    import { useTodaySummary } from '$lib/hooks/useTodaySummary'
    import { getErrorMessage } from '$lib/utils/errors'
    import { todayISO } from '$lib/utils/dates'
    import { useDailyClosure } from '../hooks/useDailyClosure'
    import ReportState from '../components/ReportState.svelte'
    import DcHeroKpis from '../components/DcHeroKpis.svelte'
    import DcMoneyBlocks from '../components/DcMoneyBlocks.svelte'
    import DcPatrimonial from '../components/DcPatrimonial.svelte'
    import DcPurchases from '../components/DcPurchases.svelte'
    import DcCashAccounts from '../components/DcCashAccounts.svelte'
    import DcAdjustmentNotes from '../components/DcAdjustmentNotes.svelte'

    const date = todayISO()
    const closure = useDailyClosure(date)
    const today = useTodaySummary()

    const dc = $derived($closure.data)
    const summary = $derived($today.data)
</script>

<div class="px-5 pb-8 pt-3">
    {#if $closure.isLoading}
        <ReportState kind="loading" />
    {:else if $closure.isError || !dc}
        <ReportState kind="error" message={getErrorMessage($closure.error)} />
    {:else}
        <div class="flex flex-col gap-4">
            <DcHeroKpis {dc} today={summary} />
            <DcMoneyBlocks {dc} />
            {#if summary}
                <DcPatrimonial today={summary} />
                <DcPurchases today={summary} />
                <DcCashAccounts today={summary} />
            {:else if $today.isError}
                <p class="px-4 text-center text-xs text-muted-foreground">
                    No se pudieron cargar patrimonio, compras ni saldos de cuentas.
                </p>
            {/if}
            <DcAdjustmentNotes {dc} />
        </div>
    {/if}
</div>
