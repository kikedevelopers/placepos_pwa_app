import Big from 'big.js'

/**
 * Matemática de una línea del POS, port fiel de placepos desktop
 * (`modules/PointOfSale/utils/posLineMath.ts` + `utils/priceCalculations.ts`).
 * Centralizada para que el configurador y el store del carrito NO diverjan:
 * era la raíz del bug donde la cantidad se redondeaba y el total nacía de esa
 * cantidad redondeada (24,0964 × 83 = 2.000,3 en vez de los 2.000 digitados).
 *
 * Reglas de precisión (Big.js, fieles a las escalas del proyecto):
 *   - Dinero → 2 decimales SOLO al final (total, ganancia).
 *   - Porcentajes/márgenes → 4 decimales.
 *   - Cantidad-desde-monto → precisión COMPLETA, sin redondeo prematuro, para
 *     que `cantidad × precio` reconstruya el monto exacto a escala de dinero.
 */

const MONEY_SCALE = 2
const MARGIN_SCALE = 4

/** Redondea con Big.js (toFixed) evitando ruido IEEE-754. Igual que placepos. */
export function roundToDecimals(value: number | undefined | null, decimals = MONEY_SCALE): number {
    if (value === undefined || value === null || !Number.isFinite(value)) return 0
    try {
        return Number(new Big(value).toFixed(decimals))
    } catch {
        return 0
    }
}

/**
 * Ganancia por unidad = `salePrice − cost`, redondeada a 2 decimales.
 */
export function calculateProfit(salePrice: number, cost: number): number {
    return Number(new Big(salePrice).minus(cost).round(MONEY_SCALE).toString())
}

/**
 * Margen (%) directo desde precio de venta y costo, a 4 decimales.
 *   margin = ((salePrice − cost) / salePrice) × 100
 * Devuelve 0 si `salePrice <= 0`.
 */
export function calculateMarginFromPrices(salePrice: number, cost: number): number {
    if (salePrice <= 0) return 0
    const profit = new Big(salePrice).minus(cost)
    return Number(profit.div(salePrice).times(100).round(MARGIN_SCALE).toString())
}

/**
 * Cantidad EXACTA que representa un `amount` (monto total) a un `unitPrice`.
 *   quantity = amount / unitPrice
 * NO se redondea: máxima precisión para que `lineTotal` reconstruya el monto.
 * Devuelve 0 si el precio o el monto no son positivos.
 */
export function quantityFromAmount(amount: number, unitPrice: number): number {
    if (!(unitPrice > 0) || !(amount > 0)) return 0
    return new Big(amount).div(unitPrice).toNumber()
}

/**
 * Total de dinero de una línea = `unitPrice × quantity`, a 2 decimales.
 */
export function lineTotal(unitPrice: number, quantity: number): number {
    return roundToDecimals(new Big(unitPrice || 0).times(quantity || 0).toNumber(), MONEY_SCALE)
}

/**
 * Ganancia de una línea = ganancia_por_unidad × quantity, a 2 decimales.
 */
export function lineProfit(unitPrice: number, cost: number, quantity: number): number {
    return roundToDecimals(
        new Big(calculateProfit(unitPrice, cost)).times(quantity || 0).toNumber(),
        MONEY_SCALE
    )
}

export interface ConfiguredLineInput {
    /** Precio unitario efectivo (lista seleccionada o precio manual). */
    price: number
    /** Costo del producto (para ganancia/margen). */
    cost: number
    /** Cantidad digitada (modo normal). */
    quantity: number
    /** Monto/precio del campo "Precio Personalizado"/"Monto Total". 0 si vacío. */
    manualPrice: number
    /** ¿Está activo el "Cálculo por monto"? */
    isAutoCalcMode: boolean
}

export interface ConfiguredLine {
    quantity: number
    price: number
    total: number
    profit: number
    margin: number
    /** true si el precio es manual o si se usó cálculo por monto. */
    isManual: boolean
}

/**
 * Deriva la línea final que se agrega al carrito, fiel al `onSubmit` de
 * placepos. Es una función pura para poder testear la aritmética sin montar el
 * componente.
 *
 * En modo "cálculo por monto" (`isAutoCalcMode && manualPrice > 0`):
 *   - la cantidad se RE-DERIVA del monto y se redondea a 4 decimales (escala
 *     máxima que aceptan BD y pos_api),
 *   - el total se PINA al monto digitado (exacto), NO se recalcula desde la
 *     cantidad redondeada. Así 2.000 quedan 2.000 aunque 24,0964 × 83 ≠ 2.000.
 */
export function buildConfiguredLine({
    price,
    cost,
    quantity,
    manualPrice,
    isAutoCalcMode
}: ConfiguredLineInput): ConfiguredLine {
    const hasManualPrice = manualPrice > 0
    const isManual = hasManualPrice || isAutoCalcMode
    const isAmountMode = isAutoCalcMode && manualPrice > 0

    const rawQuantity = typeof quantity === 'number' && !isNaN(quantity) ? quantity : 1
    const finalPrice = typeof price === 'number' && !isNaN(price) ? price : 0

    const finalQuantity = roundToDecimals(
        isAmountMode ? quantityFromAmount(manualPrice, finalPrice) : rawQuantity,
        4
    )

    const total = isAmountMode ? roundToDecimals(manualPrice, MONEY_SCALE) : lineTotal(finalPrice, finalQuantity)

    return {
        quantity: finalQuantity,
        price: finalPrice,
        total,
        profit: lineProfit(finalPrice, cost, finalQuantity),
        margin: calculateMarginFromPrices(finalPrice, cost),
        isManual
    }
}
