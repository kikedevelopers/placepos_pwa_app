import type { ChargeOrder } from '$lib/modules/POS/pages/Pos/hooks/usePayment.svelte'

/**
 * Store global para abrir la ventana de cobro de un pedido (ORDER → SALE) desde
 * cualquier parte (POS o Reportes, vía el TicketViewer). El host (`ChargeHost`)
 * renderiza el PaymentModal cuando hay un pedido cargado.
 */
class ChargeOrderStore {
    order = $state<ChargeOrder | null>(null)

    open(order: ChargeOrder) {
        this.order = order
    }

    close() {
        this.order = null
    }
}

export const chargeOrder = new ChargeOrderStore()
