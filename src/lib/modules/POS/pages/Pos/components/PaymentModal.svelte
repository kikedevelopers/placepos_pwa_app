<script lang="ts">
    import type { ChargeOrder } from '../hooks/usePayment.svelte'
    import PaymentModalBody from './PaymentModalBody.svelte'

    interface Props {
        visible: boolean
        order: ChargeOrder | null
        onClose: () => void
        onPaid: () => void
    }
    let { visible, order, onClose, onPaid }: Props = $props()
</script>

{#if visible && order}
    <!--
      Modal a pantalla completa con animación de entrada (paridad RN
      animationType="slide"). El cuerpo se remonta por pedido vía {#key
      order.invoice_id} para que usePayment reinicie su estado/idempotencia.
    -->
    <div class="fixed inset-0 z-50 flex flex-col bg-background motion-safe:animate-slide-up">
        {#key order.invoice_id}
            <PaymentModalBody {order} {onClose} {onPaid} />
        {/key}
    </div>
{/if}
