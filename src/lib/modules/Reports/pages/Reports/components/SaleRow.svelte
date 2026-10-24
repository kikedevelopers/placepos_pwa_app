<script lang="ts">
    import type { SalesReportTicket } from '$lib/api/requests/reports/types'
    import { ticketViewer } from '$lib/components/TicketViewer'
    import { Money, TONE_SOFT, timeLabel, percent } from '$lib/components/premium'
    import { cn } from '$lib/utils'
    import { saleRowModel } from '../utils/saleRow'

    interface Props {
        ticket: SalesReportTicket
        canViewProfit: boolean
    }
    let { ticket, canViewProfit }: Props = $props()

    const m = $derived(saleRowModel(ticket))
    const open = () => {
        if (m.invoiceId != null) ticketViewer.open(m.invoiceId)
    }
</script>

<button
    type="button"
    onclick={open}
    disabled={m.invoiceId == null}
    aria-label={`${m.kindLabel} ${m.number}, ${ticket.customerName}`}
    class="row flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-100 ease-out active:bg-foreground/[0.05] disabled:active:bg-transparent"
>
    <span
        class={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] text-[12px] font-bold tracking-[0.02em]',
            TONE_SOFT[m.tone]
        )}
        aria-hidden="true"
    >
        {m.glyph}
    </span>
    <span class="min-w-0 flex-1">
        <span class="block truncate text-[15px] font-medium text-foreground">{ticket.customerName}</span>
        <span class="mt-0.5 block truncate text-[12.5px] text-muted-foreground">
            {m.number} · {timeLabel(ticket.createdAt)} · {m.paymentLabel}
        </span>
    </span>
    <span class="flex shrink-0 flex-col items-end">
        <Money
            value={ticket.consolidatedTotal}
            class={cn(
                'text-[15.5px] font-semibold tracking-[-0.01em]',
                m.voided ? 'text-muted-foreground line-through' : 'text-foreground'
            )}
        />
        {#if m.voided}
            <span class="mt-0.5 text-[11.5px] font-medium text-destructive">Anulada</span>
        {:else if canViewProfit && ticket.rowType === 'INVOICE'}
            <span
                class={cn(
                    'mt-0.5 text-[11.5px] font-medium tabular-nums',
                    ticket.profit >= 0 ? 'text-success' : 'text-destructive'
                )}
            >
                {percent(ticket.margin)} margen
            </span>
        {/if}
    </span>
</button>
