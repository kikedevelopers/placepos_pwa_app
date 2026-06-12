<script lang="ts">
    import { useQueryClient } from '@tanstack/svelte-query'
    import PaymentModal from '$lib/modules/POS/pages/Pos/components/PaymentModal.svelte'
    import { chargeOrder } from '$lib/stores/chargeOrder.svelte'

    // Host global del flujo de cobro: el PaymentModal se abre cuando
    // `chargeOrder.open(order)` carga un pedido. Tras cobrar, refresca todo
    // (detalle del ticket, listas del día, reportes, items, caja) y cierra.
    const queryClient = useQueryClient()

    const onPaid = () => {
        queryClient.invalidateQueries()
        chargeOrder.close()
    }
</script>

<PaymentModal
    visible={chargeOrder.order != null}
    order={chargeOrder.order}
    onClose={() => chargeOrder.close()}
    {onPaid}
/>
