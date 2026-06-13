import { z } from 'zod'
import { roundTo } from '$lib/utils/numbers'

export const MOVEMENT_TYPE = {
    INCOME: 'INCOME',
    EXPENSE: 'EXPENSE'
} as const

export type AdjustmentMovementType = (typeof MOVEMENT_TYPE)[keyof typeof MOVEMENT_TYPE]

export const DESCRIPTION_MAX = 280

export const adjustmentSchema = z.object({
    target_balance: z
        .number({ message: 'Ingresa el saldo final deseado' })
        .min(0, 'El saldo no puede ser negativo'),
    description: z
        .string()
        .trim()
        .min(1, 'Documenta el motivo del ajuste')
        .max(DESCRIPTION_MAX, `Máximo ${DESCRIPTION_MAX} caracteres`)
})

export type AdjustmentFormData = z.infer<typeof adjustmentSchema>

export const adjustmentDefaults = (balance: number): AdjustmentFormData => ({
    target_balance: balance,
    description: ''
})

export interface ComputedAdjustment {
    /** Tipo de movimiento que el sistema registrará para alcanzar el saldo objetivo. */
    movementType: AdjustmentMovementType
    /** Monto absoluto del movimiento (la diferencia), redondeado a 2 decimales. */
    amount: number
    /** Diferencia con signo (objetivo − actual). */
    diff: number
    /** Si hay un cambio real de saldo (false cuando objetivo === actual o sin dato). */
    hasChange: boolean
}

/**
 * A partir del saldo actual y el saldo final deseado por el usuario, calcula el
 * movimiento (ingreso o egreso) que el sistema debe registrar por la diferencia.
 *
 * - objetivo > actual → INGRESO por la diferencia.
 * - objetivo < actual → EGRESO por la diferencia.
 * - objetivo = actual (o sin dato) → sin cambio, no se registra movimiento.
 *
 * Como el saldo objetivo siempre es >= 0, un egreso nunca puede dejar la caja
 * en negativo, por lo que no se requiere validación adicional de saldo.
 */
export const computeAdjustment = (
    currentBalance: number,
    targetBalance: number | null | undefined
): ComputedAdjustment => {
    if (targetBalance == null || Number.isNaN(targetBalance)) {
        return { movementType: MOVEMENT_TYPE.INCOME, amount: 0, diff: 0, hasChange: false }
    }
    const diff = roundTo(targetBalance - (currentBalance ?? 0), 2)
    return {
        movementType: diff >= 0 ? MOVEMENT_TYPE.INCOME : MOVEMENT_TYPE.EXPENSE,
        amount: Math.abs(diff),
        diff,
        hasChange: diff !== 0
    }
}
