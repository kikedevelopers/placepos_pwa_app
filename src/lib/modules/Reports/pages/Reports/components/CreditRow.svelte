<script lang="ts">
    import type { CreditReportItem } from '$lib/api/requests/reports/types'
    import { ticketViewer } from '$lib/components/TicketViewer'
    import { Money, TONE_TEXT, shortDate } from '$lib/components/premium'
    import { cn } from '$lib/utils'
    import { creditRowModel, initials } from '../utils/creditRow'

    interface Props {
        credit: CreditReportItem
    }
    let { credit }: Props = $props()

    const m = $derived(creditRowModel(credit))
</script>

<!-- `credit.id` es el sale_invoice_id: abre el mismo visor que Ventas. -->
<button
    type="button"
    onclick={() => ticketViewer.open(credit.id)}
    aria-label={`Crédito ${m.number} de ${credit.customerName}`}
    class="row flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors duration-100 active:bg-foreground/[0.05]"
>
    <span
        aria-hidden="true"
        class={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold',
            m.overdue ? 'bg-destructive/10 text-destructive' : 'bg-foreground/[0.06] text-foreground/75'
        )}
    >
        {initials(credit.customerName)}
    </span>
    <span class="min-w-0 flex-1">
        <span class="flex items-baseline justify-between gap-2">
            <span class="truncate text-[15px] font-medium text-foreground">{credit.customerName}</span>
            <Money
                value={credit.balance}
                class={cn('shrink-0 text-[15.5px] font-semibold', credit.balance > 0 ? (m.overdue ? 'text-destructive' : 'text-foreground') : 'text-success')}
            />
        </span>
        <span class="mt-0.5 block truncate text-[12.5px] text-muted-foreground">
            {#if m.dueLabel}<span class={cn('font-medium', TONE_TEXT[m.dueTone])}>{m.dueLabel}</span>{' · '}{/if}{m.number}{' · '}{shortDate(credit.createdAt)}
        </span>
        {#if credit.paidAmount > 0 && credit.balance > 0}
            <span class="mt-2 flex items-center gap-2">
                <span class="block h-[3px] flex-1 overflow-hidden rounded-full bg-foreground/[0.07]" aria-hidden="true">
                    <span class="block h-full rounded-full bg-success" style="width:{Math.round(m.paidRatio * 100)}%"></span>
                </span>
                <span class="shrink-0 text-[11.5px] tabular-nums text-muted-foreground">
                    abonado <Money value={credit.paidAmount} /> de <Money value={credit.totalAmount} />
                </span>
            </span>
        {/if}
    </span>
</button>
