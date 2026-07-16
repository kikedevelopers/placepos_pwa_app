import Big from 'big.js'

/**
 * Matemática de precios del formulario de producto/presentación. Espejo de
 * `placepos/src/renderer/src/utils/priceCalculations.ts`.
 *
 * Escalas: dinero a 2 decimales, márgenes a 4 — las MISMAS que la columna
 * `product_prices.margin` de la BD (numeric(15,4)). Antes el margen se
 * calculaba aquí con un `round2` inline: perdía dos decimales frente al propio
 * esquema y frente a placepos.
 *
 * Y esos dos decimales no son cosmética: son lo que hace que el modo "margen"
 * cuadre al ir y volver. Con costo 2000 y precio 3000 el margen es 33,3333…%;
 * guardando 33,3333 el inverso devuelve 3000 exacto, pero guardando 33,33
 * devuelve 2999,85.
 */
const MONEY_SCALE = 2
const MARGIN_SCALE = 4

/** ganancia = precio − costo. */
export const calculateProfit = (salePrice: number, cost: number): number =>
    Number(new Big(salePrice).minus(cost).round(MONEY_SCALE).toString())

/** margen = (precio − costo) / precio × 100. Margen SOBRE VENTA. */
export const calculateMarginFromPrices = (salePrice: number, cost: number): number => {
    if (salePrice <= 0) return 0
    return Number(
        new Big(salePrice).minus(cost).div(salePrice).times(100).round(MARGIN_SCALE).toString()
    )
}

export const calculatePriceFields = (
    salePrice: number,
    cost: number
): { profit: number; margin: number } => ({
    profit: calculateProfit(salePrice, cost),
    margin: calculateMarginFromPrices(salePrice, cost)
})

/**
 * Inverso: precio a partir del costo y un margen objetivo.
 * Despejando `margin = (precio − costo)/precio × 100` → `precio = costo / (1 − margen/100)`.
 *
 * `null` cuando el margen no es aplicable y por tanto NO se debe tocar el precio:
 *   - `cost <= 0`: con costo 0 el margen es siempre 100%; el inverso es indefinido.
 *   - `margin < 0`: daría precio < costo (venta a pérdida).
 *   - `margin >= 100`: división por cero o negativa (precio infinito/negativo).
 *
 * OJO con la sensibilidad: el denominador tiende a 0 cuando el margen se acerca
 * a 100, así que ahí un cambio mínimo en el margen mueve el precio muchísimo.
 * Es la naturaleza de la fórmula, no un defecto del redondeo.
 */
export const calculatePriceFromMargin = (cost: number, margin: number): number | null => {
    if (cost <= 0) return null
    if (margin < 0 || margin >= 100) return null
    const denom = new Big(1).minus(new Big(margin).div(100))
    if (denom.lte(0)) return null
    return Number(new Big(cost).div(denom).round(MONEY_SCALE).toString())
}
