<script lang="ts">
    import { cn } from '$lib/utils'
    import type { AgentOrder } from '$lib/api/requests/agentOrders/types'
    import { statusPillLabel } from '../utils/orderActions'

    /** Estado del pedido: punto + texto (el color nunca va solo). */
    interface Props {
        order: Pick<AgentOrder, 'status' | 'cancelled_by_customer'>
        class?: string
    }
    let { order, class: className = '' }: Props = $props()

    const TONE = {
        pending: 'bg-warning/[0.12] text-[hsl(32_95%_32%)] dark:text-warning',
        taken: 'bg-success/10 text-success',
        dismissed: 'bg-foreground/[0.06] text-muted-foreground'
    } as const
    const DOT = {
        pending: 'bg-warning',
        taken: 'bg-success',
        dismissed: 'bg-muted-foreground/60'
    } as const
</script>

<span
    class={cn(
        'inline-flex h-[22px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2 text-[11px] font-semibold',
        TONE[order.status],
        className
    )}
>
    <span aria-hidden="true" class={cn('h-1.5 w-1.5 rounded-full', DOT[order.status])}></span>
    {statusPillLabel(order)}
</span>
