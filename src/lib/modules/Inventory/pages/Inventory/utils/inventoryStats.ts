import type { Product } from '$lib/api/requests/products'

export interface InventoryStats {
    /** Productos BASE registrados (las presentaciones no cuentan como referencia aparte). */
    count: number
    /** Valorización del inventario: costo del stock disponible. */
    valuation: number
    /** Productos base sin existencias. */
    outOfStock: number
}

/**
 * Estadísticas del inventario. Espejo de `calculateAnalytics` de placepos.
 *
 * Solo cuenta productos BASE (`parent_id == null`): las presentaciones comparten
 * el MISMO stock físico que su base (su `stock_display` se deriva del padre), así
 * que incluirlas duplicaría el valor.
 *
 * Valorización = `cost × stock_display`. El `cost` del base se guarda por EMPAQUE
 * (ej. caja de 25 = 44.000) y `stock` es crudo en unidad mínima (25 sobres);
 * multiplicar `cost × stock` mezclaría unidades e inflaría el total por el factor
 * de empaque. `stock_display` (= stock / packaging.value) lo deja en unidades de
 * empaque, coherente con `cost`. Sin empaque, `stock_display == stock`.
 *
 * Los COMBO cuentan como referencia y como agotados, pero NO se valorizan: su
 * `stock_display` es DERIVADO del stock de sus componentes, que ya están
 * valorizados por su cuenta. Sumarlos contaría dos veces el mismo inventario
 * físico. Espejo de `calculateAnalytics` de placepos.
 */
export function computeInventoryStats(products: Product[]): InventoryStats {
    const base = products.filter((p) => p.parent_id == null)
    return {
        count: base.length,
        valuation: base
            .filter((p) => p.stock_display > 0 && p.product_type !== 'COMBO')
            .reduce((acc, p) => acc + Number(p.cost) * p.stock_display, 0),
        outOfStock: base.filter((p) => p.stock_display <= 0).length
    }
}
