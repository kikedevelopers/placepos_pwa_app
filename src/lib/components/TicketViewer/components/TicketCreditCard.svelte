<script lang="ts">
    import { CalendarClock } from '@lucide/svelte'
    import type { SaleCredit } from '$lib/api/requests/sales'
    import { formatCurrency } from '$lib/utils/numbers'
    import { formatShortDate } from '$lib/utils/dates'
    import CollapsibleSection from './CollapsibleSection.svelte'

    interface Props {
        credit: SaleCredit
    }
    let { credit }: Props = $props()

    const overdue = $derived(
        credit.dueDate ? new Date(credit.dueDate) < new Date() && credit.balance > 0 : false
    )
    const balanceTone = $derived(overdue ? 'hsl(0, 74%, 48%)' : 'hsl(32, 95%, 40%)')
</script>

{#snippet row(label: string, value: string, tone?: string)}
    <div class="flex items-center justify-between py-1.5">
        <span class="text-sm text-muted-foreground">{label}</span>
        <span class="text-sm font-semibold tabular-nums" style={tone ? `color:${tone}` : ''}
            >{value}</span
        >
    </div>
{/snippet}

<CollapsibleSection
    title="Crédito"
    subtitle={`Saldo ${formatCurrency(credit.balance)}`}
    icon={CalendarClock}
    iconColor={balanceTone}
    iconBg={overdue ? 'hsla(0, 84%, 55%, 0.12)' : 'hsla(32, 95%, 44%, 0.14)'}
>
    {#snippet trailing()}
        {#if overdue}
            <span
                class="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                style="background-color:hsla(0,84%,55%,0.14);color:hsl(0,74%,48%)">Vencido</span
            >
        {/if}
    {/snippet}

    <div class="pt-1">
        {@render row('Saldo pendiente', formatCurrency(credit.balance), balanceTone)}
        {@render row('Abonado', formatCurrency(credit.paidAmount))}
        {@render row('Total del crédito', formatCurrency(credit.totalAmount))}
        <div class="mt-1.5 border-t border-border/50 pt-1.5">
            {@render row('Vence', credit.dueDate ? formatShortDate(credit.dueDate) : '—')}
        </div>
    </div>
</CollapsibleSection>
