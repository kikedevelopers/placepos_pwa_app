import type { Product } from '$lib/api/requests/products'
import type { Tone } from '$lib/components/premium/tones'

/**
 * Filtros y presentación del listado de Inventario (puros y testeados).
 */
export type InventoryFilter = 'all' | 'base' | 'presentation' | 'out'

export const INVENTORY_FILTERS: readonly { value: InventoryFilter; label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'base', label: 'Bases' },
    { value: 'presentation', label: 'Present.' },
    { value: 'out', label: 'Agotados' }
]

/** Umbral de "stock bajo" (mismo que tenía la tarjeta anterior). */
export const LOW_STOCK_THRESHOLD = 10

const matchesQuery = (p: Product, q: string): boolean =>
    p.name.toLowerCase().includes(q) ||
    (p.sku_code ?? '').toLowerCase().includes(q) ||
    (p.bar_code ?? '').toLowerCase().includes(q)

/** Búsqueda por nombre/SKU/código + filtro por tipo o existencias. */
export function filterInventory(products: readonly Product[], query: string, filter: InventoryFilter): Product[] {
    const q = query.trim().toLowerCase()
    return products.filter((p) => {
        if (q && !matchesQuery(p, q)) return false
        switch (filter) {
            case 'base':
                return p.parent_id == null
            case 'presentation':
                return p.parent_id != null
            case 'out':
                return p.stock_display <= 0
            default:
                return true
        }
    })
}

/** Cuántos productos caen en cada filtro (para las etiquetas). */
export function countByFilter(products: readonly Product[]): Record<InventoryFilter, number> {
    return {
        all: products.length,
        base: products.filter((p) => p.parent_id == null).length,
        presentation: products.filter((p) => p.parent_id != null).length,
        out: products.filter((p) => p.stock_display <= 0).length
    }
}

export interface StockBadge {
    label: string
    tone: Tone
}

/** Estado de existencias: negativo (rojo), agotado (rojo), bajo (ámbar) o normal. */
export function stockState(stock: number): StockBadge {
    if (stock < 0) return { label: 'Negativo', tone: 'negative' }
    if (stock === 0) return { label: 'Agotado', tone: 'negative' }
    if (stock < LOW_STOCK_THRESHOLD) return { label: 'Bajo', tone: 'warning' }
    return { label: 'Disponible', tone: 'neutral' }
}
