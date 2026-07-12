import Big from 'big.js'

// Conversión del stock de un PRODUCTO BASE entre "unidad de empaque" (paquetes,
// lo que el usuario digita/ve) y "unidad mínima" (lo que persiste el backend en
// Product.stock y sobre lo que operan ventas, compras y el stock derivado de las
// presentaciones). Espejo EXACTO de placepos:
// src/renderer/src/modules/Inventory/utils/baseStock.ts.
//
// Regla del modelo unificado: minimal = paquetes × packaging_value. El formulario
// del base era el único punto que NO respetaba esta regla (guardaba el número en
// crudo, sin multiplicar). Estas funciones centralizan la conversión.
//
// Redondeo a 4 decimales (roundHalfUp) para alinear con numeric(15,4) del backend.

const normalizeValue = (packagingValue: number | null | undefined): number =>
    typeof packagingValue === 'number' && packagingValue > 0 ? packagingValue : 1

// unidad mínima (persistida) -> unidad de empaque (lo que ve el usuario).
export const toPackageStock = (
    minimalStock: number,
    packagingValue: number | null | undefined
): number => new Big(minimalStock).div(normalizeValue(packagingValue)).round(4, Big.roundHalfUp).toNumber()

// unidad de empaque (lo que digita el usuario) -> unidad mínima (a persistir).
export const toMinimalStock = (
    packageStock: number,
    packagingValue: number | null | undefined
): number => new Big(packageStock).times(normalizeValue(packagingValue)).round(4, Big.roundHalfUp).toNumber()

// Al cambiar el empaque EN EDICIÓN, recalcula los paquetes visibles preservando
// el stock físico (unidad mínima): minimal = paquetes × valorAnterior, luego
// paquetesNuevos = minimal / valorNuevo.
export const repackageStock = (
    currentPackages: number,
    prevPackagingValue: number | null | undefined,
    nextPackagingValue: number | null | undefined
): number => toPackageStock(toMinimalStock(currentPackages, prevPackagingValue), nextPackagingValue)
