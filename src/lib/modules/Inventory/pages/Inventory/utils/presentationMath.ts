import Big from 'big.js'

/**
 * Matemática PURA de la presentación (costo calculado del padre), espejo de
 * `placepos: ProductVariantForm/hooks/useVariantForm.ts`. Big.js con redondeo
 * halfUp a 2 decimales, como el desktop.
 */

Big.DP = 10
Big.RM = Big.roundHalfUp

const round2 = (n: number): number =>
    Number(new Big(Number.isFinite(n) ? n : 0).round(2).toString())

/**
 * Costo calculado de la presentación = (costo por unidad-base del padre) ×
 * `effectiveValue`. `effectiveValue` = unidades base que representa 1 unidad de
 * la presentación.
 */
export function computeCalculatedCost(
    parentCost: number,
    parentPackagingValue: number,
    effectiveValue: number
): number {
    if (!(parentPackagingValue > 0) || !(effectiveValue > 0)) return 0
    return round2(new Big(parentCost).div(parentPackagingValue).times(effectiveValue).toNumber())
}
