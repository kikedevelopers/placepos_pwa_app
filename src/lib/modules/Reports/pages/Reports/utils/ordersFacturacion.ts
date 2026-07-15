/**
 * Facturación de pedidos (tickets ORDER) en los informes de Finanzas.
 *
 * Cuando el flag `include_orders_in_reports` está activo, el backend expone la
 * facturación de los pedidos del rango/día en dos contratos distintos:
 *
 *   - Resumen extendido → `ventas.pedidos` (y `ventas.total` ya los incluye).
 *   - Resumen del día   → `ordersTotal` (campo plano).
 *
 * En ambos casos la caja/recaudo NO cambia (un pedido sin cobrar no entra a
 * caja); el front solo muestra la línea "Pedidos (facturación)" cuando hay algo
 * que mostrar. La normalización es idéntica para los dos, así que vive en
 * `normalizeOrdersAmount` y los accesores solo eligen el campo.
 */

/**
 * Normaliza un importe de facturación de pedidos a un número > 0, o 0.
 * Defensivo: ausente/null/no numérico/no finito/negativo → 0.
 */
export function normalizeOrdersAmount(raw: unknown): number {
    if (typeof raw !== 'number' || !Number.isFinite(raw) || raw <= 0) {
        return 0
    }
    return raw
}

/** Facturación de pedidos del RESUMEN EXTENDIDO (`ventas.pedidos`). */
export function ordersFacturacion(ventas: { pedidos?: number | null } | null | undefined): number {
    return normalizeOrdersAmount(ventas?.pedidos)
}

/** `true` si debe mostrarse la línea de pedidos en el resumen extendido. */
export function hasOrdersFacturacion(
    ventas: { pedidos?: number | null } | null | undefined
): boolean {
    return ordersFacturacion(ventas) > 0
}

/** Facturación de pedidos del RESUMEN DEL DÍA (`ordersTotal`). */
export function ordersTotalOfClosure(
    dc: { ordersTotal?: number | null } | null | undefined
): number {
    return normalizeOrdersAmount(dc?.ordersTotal)
}

/** `true` si debe mostrarse la línea de pedidos en el resumen del día. */
export function hasOrdersTotalOfClosure(
    dc: { ordersTotal?: number | null } | null | undefined
): boolean {
    return ordersTotalOfClosure(dc) > 0
}
