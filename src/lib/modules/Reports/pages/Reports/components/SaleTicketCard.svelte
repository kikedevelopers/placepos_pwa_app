<script lang="ts">
    import { Ban, ChevronRight } from '@lucide/svelte'
    import type { SalesReportTicket } from '$lib/api/requests/reports'
    import PressableScale from '$lib/components/PressableScale.svelte'
    import { ticketViewer } from '$lib/components/TicketViewer'
    import { formatCurrency } from '$lib/utils/numbers'
    import { formatDateTime } from '$lib/utils/dates'
    import Badge, { type BadgeTone } from './Badge.svelte'

    interface Props {
        ticket: SalesReportTicket
    }
    let { ticket }: Props = $props()

    const ticketBadge = (t: SalesReportTicket): { label: string; tone: BadgeTone } => {
        if (t.rowType === 'NOTE') {
            return t.noteType === 'CREDIT'
                ? { label: 'NC', tone: 'warning' }
                : { label: 'ND', tone: 'primary' }
        }
        return t.ticketType === 'ORDER'
            ? { label: 'PED', tone: 'warning' }
            : { label: 'VEN', tone: 'success' }
    }

    const badge = $derived(ticketBadge(ticket))
    const number = $derived(
        ticket.rowType === 'NOTE' ? ticket.noteNumber : (ticket.saleNumber ?? ticket.ticketNumber)
    )
    // Una fila NOTE abre el detalle de su factura padre; una INVOICE abre la suya.
    const invoiceId = $derived(ticket.rowType === 'NOTE' ? ticket.parentInvoiceId : ticket.id)

    const handlePress = () => {
        if (invoiceId != null) ticketViewer.open(invoiceId)
    }
</script>

<PressableScale
    as="div"
    onclick={handlePress}
    disabled={invoiceId == null}
    ariaLabel={`Ver detalle del ticket ${number ?? ''}`}
    class="block w-full text-left"
    style="box-shadow:0 4px 10px hsla(222,47%,11%,0.04)"
>
    <div class="rounded-2xl border border-border bg-card p-4">
        <div class="mb-2 flex items-center justify-between">
            <div class="flex items-center gap-2">
                <Badge label={badge.label} tone={badge.tone} />
                <span class="text-sm font-semibold text-foreground">{number ?? '—'}</span>
                {#if ticket.isDeleted}
                    <Ban size={13} color="hsl(0, 84%, 55%)" />
                {/if}
            </div>
            <span class="text-[11px] text-muted-foreground">{formatDateTime(ticket.createdAt)}</span>
        </div>

        <p class="truncate text-sm text-foreground">{ticket.customerName}</p>
        <p class="mt-0.5 truncate text-[11px] text-muted-foreground">
            {ticket.createdBy ? `por ${ticket.createdBy} · ` : ''}
            {ticket.isCredit ? 'Crédito' : 'Contado'}
        </p>

        <div class="mt-3 flex items-end justify-between border-t border-border/60 pt-3">
            <div>
                <p class="text-[11px] text-muted-foreground">Ganancia</p>
                <p
                    class="text-xs font-semibold {ticket.profit >= 0
                        ? 'text-success'
                        : 'text-destructive'}"
                >
                    {formatCurrency(ticket.profit)} · {ticket.margin.toFixed(1)}%
                </p>
            </div>
            <div class="flex items-center gap-1.5">
                <span
                    class="text-base font-bold {ticket.isDeleted
                        ? 'text-destructive line-through'
                        : 'text-foreground'}"
                >
                    {formatCurrency(ticket.consolidatedTotal)}
                </span>
                {#if invoiceId != null}
                    <ChevronRight size={16} color="hsl(215, 16%, 65%)" />
                {/if}
            </div>
        </div>
    </div>
</PressableScale>
