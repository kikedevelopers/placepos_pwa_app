/**
 * Estado del visor de tickets (equivalente al store zustand `useTicketViewer`
 * de pos_app). Abre un detalle de venta/crédito por su `sale_invoice_id`.
 * El contenido completo del ticket (recibo, hero, compartir) se porta como
 * módulo dedicado; por ahora el host muestra el detalle base.
 */
class TicketViewerStore {
    ticketId = $state<number | null>(null)
    visible = $state(false)

    open(id: number) {
        this.ticketId = id
        this.visible = true
    }

    close() {
        this.visible = false
        this.ticketId = null
    }
}

export const ticketViewer = new TicketViewerStore()
