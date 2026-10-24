import Big from 'big.js'
import type { FinancialMovement } from '$lib/api/requests/financial-movements/types'
import { isPositiveMovement } from '../constants/concepts'

/**
 * Lógica pura de la pantalla de cuentas (Bancos / Billeteras): qué tarjeta del
 * carrusel quedó centrada y los totales de los movimientos del periodo.
 */

/** Índice de la tarjeta encajada según el desplazamiento horizontal. */
export function snapIndex(scrollLeft: number, step: number, count: number): number {
    if (count <= 0 || step <= 0 || !Number.isFinite(scrollLeft)) return 0
    return Math.min(count - 1, Math.max(0, Math.round(scrollLeft / step)))
}

export interface MovementTotals {
    income: number
    expense: number
    net: number
    count: number
}

/** Entradas, salidas y neto de una lista de movimientos (centavos sin ruido). */
export function movementTotals(movements: readonly FinancialMovement[]): MovementTotals {
    let income = new Big(0)
    let expense = new Big(0)
    for (const m of movements) {
        const amount = new Big(Number(m.amount) || 0)
        if (isPositiveMovement(m.movement_type)) income = income.plus(amount)
        else expense = expense.plus(amount)
    }
    return {
        income: Number(income.toFixed(2)),
        expense: Number(expense.toFixed(2)),
        net: Number(income.minus(expense).toFixed(2)),
        count: movements.length
    }
}

/** Saldo total de varias cuentas (Big.js: dinero sin ruido de coma flotante). */
export function totalBalance(accounts: readonly { balance: number | string | null | undefined }[]): number {
    return Number(
        accounts.reduce((acc, a) => acc.plus(new Big(Number(a.balance) || 0)), new Big(0)).toFixed(2)
    )
}
