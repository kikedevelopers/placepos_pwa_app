import type { AgentOrderItem } from '$lib/api/requests/agentOrders/types'
import type { PosProduct } from '$lib/api/requests/pos'
import type { NewCartItem } from '../store/posCart.svelte'

/** Pedido del agente cargado en el carrito (se enlaza al registrarlo). */
export interface LoadedAgentOrder {
    id: number
    reference: string
    customer_label: string
    /** Número del chat (WhatsApp) o de contacto, para ubicar al cliente. */
    phone: string | null
}

export interface AgentOrderCartResult {
    items: NewCartItem[]
    /** Productos del pedido que ya no se venden en el POS (no se cargaron). */
    missing: string[]
    /** Líneas cuyo precio de lista cambió: se respeta lo que se le cotizó. */
    repriced: string[]
}

/** Mismo precio con tolerancia de centavos (los precios llegan como texto decimal). */
const samePrice = (a: number, b: number): boolean => Math.abs(a - b) < 0.005

/**
 * Convierte las líneas del pedido del agente en líneas del carrito (espejo de
 * `buildCartFromAgentOrder` de placepos):
 *   - Cantidad y PRECIO tal como se le cotizaron al cliente. Si ese precio es
 *     uno de la lista del producto, queda fijo en esa posición; si la lista
 *     cambió, queda como precio manual (y se reporta en `repriced`).
 *   - El costo sale del producto actual (ganancia y margen reales).
 *   - Lo que ya no está en el POS no se carga (se reporta en `missing`).
 */
export const buildCartFromAgentOrder = (
    items: readonly AgentOrderItem[],
    products: readonly PosProduct[]
): AgentOrderCartResult => {
    const byId = new Map(products.map((product) => [product.id, product]))
    const result: AgentOrderCartResult = { items: [], missing: [], repriced: [] }

    for (const item of items) {
        const product = byId.get(item.product_id)
        const quantity = Number(item.quantity)
        const price = Number(item.unit_price)
        if (!product || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(price)) {
            result.missing.push(item.name)
            continue
        }
        const position = product.prices.findIndex((p) => samePrice(Number(p.sale_price), price))
        if (position < 0) result.repriced.push(product.name)
        result.items.push({
            item_id: product.id,
            name: product.name,
            cost: product.cost,
            quantity,
            price,
            price_mode: position >= 0 ? 'fixed' : 'manual',
            price_position: position >= 0 ? position : null,
            note: null
        })
    }
    return result
}

/** Avisos para el cajero tras cargar el pedido (vacío = todo cuadró). */
export const agentOrderLoadWarnings = (result: Pick<AgentOrderCartResult, 'missing' | 'repriced'>): string[] =>
    [
        result.missing.length > 0
            ? `No se cargaron (ya no están en el POS): ${result.missing.join(', ')}.`
            : null,
        result.repriced.length > 0
            ? `Con el precio que se le cotizó al cliente (la lista cambió): ${result.repriced.join(', ')}.`
            : null
    ].filter((warning): warning is string => warning !== null)
