<script lang="ts">
    import { untrack } from 'svelte'
    import { ArrowLeft, X } from '@lucide/svelte'
    import { usePayment, type ChargeOrder } from '../hooks/usePayment.svelte'
    import PaymentSimpleView from './PaymentSimpleView.svelte'
    import PaymentSplitView from './PaymentSplitView.svelte'

    interface Props {
        order: ChargeOrder
        onClose: () => void
        onPaid: () => void
    }
    let { order, onClose, onPaid }: Props = $props()

    // El body se remonta por pedido vía {#key} en el host, así que capturar el
    // order/onPaid inicial es intencional (usePayment debe correr en init).
    const p = untrack(() => usePayment(order, onPaid))
</script>

<div class="flex h-full flex-col bg-background">
    <!-- Header -->
    <div class="border-b border-border/70 bg-card pt-[env(safe-area-inset-top)]">
        <div class="flex items-center justify-between px-3 py-2">
            {#if p.phase === 'simple'}
                <button
                    type="button"
                    onclick={onClose}
                    aria-label="Cerrar"
                    class="flex h-10 w-10 items-center justify-center transition-opacity active:opacity-60"
                >
                    <X size={22} color="hsl(215, 16%, 40%)" />
                </button>
                <h2 class="text-base font-bold text-foreground">Cobrar pedido</h2>
            {:else}
                <button
                    type="button"
                    onclick={p.backToSimple}
                    aria-label="Volver"
                    class="flex h-10 w-10 items-center justify-center transition-opacity active:opacity-60"
                >
                    <ArrowLeft size={22} color="hsl(215, 16%, 40%)" />
                </button>
                <h2 class="text-base font-bold text-foreground">Pago dividido</h2>
            {/if}
            <div class="w-10"></div>
        </div>
    </div>

    {#if p.phase === 'simple'}
        <PaymentSimpleView {p} />
    {:else}
        <PaymentSplitView {p} />
    {/if}
</div>
