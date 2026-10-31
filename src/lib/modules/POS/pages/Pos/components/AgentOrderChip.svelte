<script lang="ts">
    import { Bot, X } from '@lucide/svelte'
    import { posCart } from '$lib/modules/POS/store/posCart.svelte'
    import { formatPhone } from '$lib/modules/AgentOrders/utils/agentOrders'

    /**
     * Pedido del agente cargado en el carrito ("Llevar al POS"): de quién es y
     * cómo ubicarlo. Al registrar queda enlazado; la X lo saca del carrito (el
     * pedido del agente sigue por tomar).
     */
</script>

{#if posCart.agentOrder}
    {@const order = posCart.agentOrder}
    <div role="status" class="flex items-center gap-3 rounded-[16px] bg-primary/[0.08] py-2 pl-3 pr-1.5">
        <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-primary/15 text-primary">
            <Bot size={18} strokeWidth={2.1} />
        </span>
        <span class="min-w-0 flex-1">
            <span class="block truncate text-[13.5px] font-semibold text-primary">Pedido del agente {order.reference}</span>
            <span class="block truncate text-[12.5px] text-primary/75">
                {order.customer_label}{order.phone ? ` · ${formatPhone(order.phone)}` : ''}
            </span>
        </span>
        <button
            type="button"
            onclick={() => posCart.clearCart()}
            aria-label="Quitar el pedido del agente del carrito"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-primary transition-[background-color,transform] duration-150 ease-out active:scale-[0.92] active:bg-primary/15"
        >
            <X size={17} strokeWidth={2.3} />
        </button>
    </div>
{/if}
