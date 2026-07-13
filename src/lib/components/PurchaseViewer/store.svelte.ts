/**
 * Estado del visor de compras (análogo a `ticketViewer` del visor de ventas).
 * Abre el detalle de una compra por su `id`. El host global (montado en el
 * layout) reacciona a `visible`.
 */
class PurchaseViewerStore {
    purchaseId = $state<number | null>(null)
    visible = $state(false)

    open(id: number) {
        this.purchaseId = id
        this.visible = true
    }

    close() {
        this.visible = false
        this.purchaseId = null
    }
}

export const purchaseViewer = new PurchaseViewerStore()
