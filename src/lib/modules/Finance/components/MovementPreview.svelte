<script lang="ts">
    import { ArrowDownRight, ArrowUpRight, Minus } from '@lucide/svelte'
    import { formatCurrency } from '$lib/utils/numbers'
    import { MOVEMENT_TYPE, type ComputedAdjustment } from '../schemas/adjustment.schema'

    interface Props {
        adjustment: ComputedAdjustment
    }
    let { adjustment }: Props = $props()

    const isIncome = $derived(adjustment.movementType === MOVEMENT_TYPE.INCOME)
</script>

{#if !adjustment.hasChange}
    <span
        class="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-3 py-1.5 text-[12px] font-medium text-muted-foreground"
    >
        <Minus size={14} />
        Sin cambios en el saldo
    </span>
{:else}
    <span
        class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold tabular-nums transition-colors duration-200 {isIncome
            ? 'border-success/30 bg-success/10 text-success'
            : 'border-destructive/30 bg-destructive/10 text-destructive'}"
    >
        {#if isIncome}
            <ArrowUpRight size={14} strokeWidth={2.4} />
        {:else}
            <ArrowDownRight size={14} strokeWidth={2.4} />
        {/if}
        {isIncome ? 'Ingreso' : 'Egreso'} de {isIncome ? '+' : '−'}{formatCurrency(adjustment.amount)}
    </span>
{/if}
