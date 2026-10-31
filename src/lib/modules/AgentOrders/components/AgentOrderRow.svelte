<script lang="ts">
    import { MessageSquareWarning, PencilLine } from '@lucide/svelte'
    import { cn } from '$lib/utils'
    import { formatCurrency } from '$lib/utils/numbers'
    import type { AgentOrder } from '$lib/api/requests/agentOrders/types'
    import { customerLabel, initialsOf, itemsPreview, waitingLabel } from '../utils/agentOrders'
    import ChannelMark from './ChannelMark.svelte'
    import StatusPill from './StatusPill.svelte'

    /**
     * Un pedido en la bandeja: quién (con el canal en el avatar), qué pidió en
     * una línea, hace cuánto y cuánto. Lo que pide atención (el cliente lo
     * cambió o pidió algo) se marca. Un pedido que acaba de llegar se ilumina un
     * momento.
     */
    interface Props {
        order: AgentOrder
        selected?: boolean
        arrived?: boolean
        /** Muestra el estado (en "Todos" o tras cambiarlo). */
        showStatus?: boolean
        onSelect: (id: number) => void
    }
    let { order, selected = false, arrived = false, showStatus = false, onSelect }: Props = $props()

    const name = $derived(customerLabel(order))
</script>

<button
    type="button"
    onclick={() => onSelect(order.id)}
    aria-current={selected ? 'true' : undefined}
    class={cn(
        'relative flex w-full items-center gap-3 px-4 py-3.5 text-left transition-[background-color,transform] duration-150 ease-out active:bg-foreground/[0.05]',
        selected && 'bg-primary/[0.06]',
        arrived && 'arrived'
    )}
>
    <span
        class="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[hsl(217_91%_58%)] to-[hsl(232_75%_52%)] text-[14px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_4px_12px_-4px_rgba(37,99,235,0.45)]"
    >
        {initialsOf(name)}
        <ChannelMark channel={order.channel} class="absolute -bottom-0.5 -right-0.5 h-[18px] w-[18px] ring-2 ring-card" />
    </span>
    <span class="min-w-0 flex-1">
        <span class="flex items-baseline gap-2">
            <span class="min-w-0 flex-1 truncate text-[15px] font-semibold tracking-[-0.01em] text-foreground">{name}</span>
            <span class="shrink-0 text-[15px] font-semibold tabular-nums text-foreground">{formatCurrency(order.total)}</span>
        </span>
        <span class="mt-0.5 block truncate text-[13px] text-muted-foreground">{itemsPreview(order.items)}</span>
        <span class="mt-1.5 flex flex-wrap items-center gap-1.5 text-[12px] text-muted-foreground">
            <span class="tabular-nums">{waitingLabel(order.created_at)}</span>
            <span aria-hidden="true">·</span>
            <span class="tabular-nums">{order.reference}</span>
            {#if order.customer_request}
                <span class="inline-flex items-center gap-1 rounded-full bg-warning/[0.14] px-2 py-0.5 font-semibold text-[hsl(32_95%_32%)] dark:text-warning">
                    <MessageSquareWarning size={12} strokeWidth={2.3} />
                    Pide un cambio
                </span>
            {:else if order.customer_updated_at && order.status === 'pending'}
                <span class="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary">
                    <PencilLine size={12} strokeWidth={2.3} />
                    Actualizado
                </span>
            {/if}
            {#if showStatus}<StatusPill {order} />{/if}
        </span>
    </span>
</button>

<style>
    /* Llegada en vivo: un destello que se apaga solo (no se repite). */
    .arrived {
        animation: arrived 2400ms cubic-bezier(0.23, 1, 0.32, 1);
    }
    @keyframes arrived {
        0%,
        35% {
            background-color: hsl(var(--primary) / 0.1);
        }
        100% {
            background-color: transparent;
        }
    }
    @media (prefers-reduced-motion: reduce) {
        .arrived {
            animation: none;
            background-color: hsl(var(--primary) / 0.06);
        }
    }
</style>
