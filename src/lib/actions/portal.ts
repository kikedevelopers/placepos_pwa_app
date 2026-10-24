/**
 * Monta el nodo directamente en `document.body` (o en `target`). Los sheets y
 * modales a pantalla completa lo usan para que NINGÚN contenedor los atrape:
 * un ancestro `sticky`, con `transform` o con z-index crea su propio contexto
 * de apilamiento y un `fixed z-50` dentro de él puede quedar debajo de otras
 * capas (pasó con el menú de Ajustes dentro del header sticky).
 */
export function portal(node: HTMLElement, target: HTMLElement | null = null) {
    const host = target ?? (typeof document !== 'undefined' ? document.body : null)
    host?.appendChild(node)
    return {
        destroy() {
            node.remove()
        }
    }
}
