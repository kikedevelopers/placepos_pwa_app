import { createQuery } from '@tanstack/svelte-query'
import { getExpensePaymentMethods } from '$lib/api/requests/expenses'
import { EXPENSE_KEYS } from '$lib/modules/Expenses/constants/queryKeys'

/**
 * Fuentes de pago disponibles (wallets/banks/cajas) con su balance, para el
 * selector de medio de pago. La caja registradora es la abierta del actor (0 o
 * 1 item) y NO trae `name`.
 */
export const useExpensePaymentMethods = () =>
    createQuery({
        queryKey: EXPENSE_KEYS.paymentMethods,
        queryFn: getExpensePaymentMethods
    })
