import Big from 'big.js'

/**
 * Utilidades de stock de PRESENTACIÓN (producto hijo), espejo de
 * `placepos: src/renderer/src/modules/Inventory/utils/presentationStock.ts`.
 *
 * Una presentación no tiene stock propio: se deriva del stock del padre (en
 * unidad mínima) dividido por el `factor` (unidades base que representa 1 unidad
 * de la presentación = `effectiveValue`).
 */

Big.DP = 10
Big.RM = Big.roundHalfUp

/** Stock virtual (informativo): cuántas unidades completas de la presentación. */
export function computePresentationStock(parentStock: number, factor: number): number {
    if (!(factor > 0)) return 0
    return Number(new Big(parentStock).div(factor).round(0, Big.roundDown).toString())
}

/** Merma: unidad mínima del padre que sobra tras las unidades completas. */
export function computePresentationRemainder(parentStock: number, factor: number): number {
    if (!(factor > 0)) return 0
    const units = computePresentationStock(parentStock, factor)
    return Number(new Big(parentStock).minus(new Big(units).times(factor)).toString())
}
