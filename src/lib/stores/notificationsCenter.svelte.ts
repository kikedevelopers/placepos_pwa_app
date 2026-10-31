/**
 * Centro de notificaciones (panel de la campana). Global para abrirlo desde el
 * header, un aviso de otra sucursal o el toque de una notificación push
 * (`/?notifications=open`).
 */
class NotificationsCenterStore {
    isOpen = $state(false)

    open() {
        this.isOpen = true
    }

    close() {
        this.isOpen = false
    }
}

export const notificationsCenter = new NotificationsCenterStore()
