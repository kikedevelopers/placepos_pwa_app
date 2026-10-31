<script lang="ts">
    import { Receipt } from '@lucide/svelte'
    import { cn } from '$lib/utils'
    import type { AgentOrderTicket } from '$lib/api/requests/agentOrders/types'
    import { ticketKindLabel } from '../utils/orderActions'

    /**
     * Consecutivo VIGENTE del ticket donde se registró el pedido (PED-x → VTA-x).
     * Al tocarlo abre el ticket.
     */
    interface Props {
        ticket: AgentOrderTicket
        onOpen: (ticketId: number) => void
        class?: string
    }
    let { ticket, onOpen, class: className = '' }: Props = $props()

    const TONE: Record<string, string> = {
        Pedido: 'bg-primary/10 text-primary',
        Venta: 'bg-success/10 text-success',
        Crédito: 'bg-violet-500/10 text-violet-600 dark:text-violet-300',
        Préstamo: 'bg-warning/[0.12] text-[hsl(32_95%_32%)] dark:text-warning',
        Anulado: 'bg-foreground/[0.06] text-muted-foreground line-through'
    }
    const kind = $derived(ticketKindLabel(ticket))
</script>

<button
    type="button"
    onclick={(event) => {
        event.stopPropagation()
        onOpen(ticket.id)
    }}
    aria-label={`Ver ticket ${ticket.number} (${kind})`}
    class={cn(
        'inline-flex h-7 shrink-0 items-center gap-1 rounded-full px-2.5 text-[12px] font-semibold tabular-nums transition-transform duration-150 ease-out active:scale-[0.95]',
        TONE[kind],
        className
    )}
>
    <Receipt size={13} strokeWidth={2.2} />
    {ticket.number}
    {#if kind === 'Crédito'}<span class="font-medium opacity-80">· Crédito</span>{/if}
</button>
