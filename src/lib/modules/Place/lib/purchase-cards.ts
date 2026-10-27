import Big from 'big.js'
import { formatNumber } from '$lib/utils/numbers'
import type { PurchasePreviewCard, PurchasePreviewLine } from './cards'

/**
 * Presentación de las tarjetas de COMPRA de Place (vista previa armada desde
 * una factura y compra creada). Puro: la tarjeta solo pinta.
 */

export type PurchasePreviewState = 'pending' | 'expired' | 'superseded' | 'confirmed'

/**
 * Estado visible: una vista previa pendiente cuyo `expires_at` ya pasó no se
 * puede confirmar (el servidor la descartó) → "Vencida".
 */
export const purchasePreviewState = (
    card: Pick<PurchasePreviewCard, 'status' | 'expires_at'>,
    now: number = Date.now()
): PurchasePreviewState => {
    if (card.status !== 'pending') return card.status
    const expires = Date.parse(card.expires_at)
    return Number.isFinite(expires) && expires <= now ? 'expired' : 'pending'
}

export interface CostChange {
    direction: 'up' | 'down'
    /** unit_cost − last_cost (por paquete). */
    difference: number
    /** Variación % sobre el último costo; `null` si el último costo era 0. */
    percent: number | null
}

/**
 * Cambio contra el último costo registrado (Big.js: sin errores de coma
 * flotante). `null` si no hay referencia o el costo no cambió.
 */
export const costChange = (line: Pick<PurchasePreviewLine, 'unit_cost' | 'last_cost'>): CostChange | null => {
    if (line.last_cost === null) return null
    const difference = new Big(line.unit_cost).minus(line.last_cost).round(2)
    if (difference.eq(0)) return null
    const percent = new Big(line.last_cost).eq(0)
        ? null
        : Number(difference.div(line.last_cost).times(100).round(1).toString())
    return {
        direction: difference.gt(0) ? 'up' : 'down',
        difference: Number(difference.toString()),
        percent
    }
}

/** "Caja x12" / "x12" / "" (unidad suelta). */
export const describePackaging = (
    line: Pick<PurchasePreviewLine, 'packaging_name' | 'packaging_value'>
): string => {
    const value = line.packaging_value
    if (line.packaging_name) {
        return value > 1 ? `${line.packaging_name} x${formatNumber(value, 4)}` : line.packaging_name
    }
    return value > 1 ? `x${formatNumber(value, 4)}` : ''
}

/** "19%" — tasa de IVA de la línea; vacío si no lleva IVA. */
export const describeIva = (iva_rate: number): string =>
    iva_rate > 0 ? `IVA ${formatNumber(iva_rate, 2)}%` : 'Sin IVA'
