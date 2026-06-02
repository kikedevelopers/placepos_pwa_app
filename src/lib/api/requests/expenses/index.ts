import api from '$lib/api/config'
import type { ApiPayload } from '$lib/api/requests/dashboard/types'
import type {
    CreateExpensePayload,
    ExpenseListParams,
    ExpenseListResponse,
    ExpenseRecord,
    PaymentMethodsResponse,
    UpdateExpensePayload
} from './types'

/** Fuentes de pago disponibles (wallets/banks/cajas con balance). */
export const getExpensePaymentMethods = async (): Promise<PaymentMethodsResponse> => {
    const response = await api.get<ApiPayload<PaymentMethodsResponse>>(
        '/expenses/payment-methods'
    )
    return response.data.payload
}

/** Listado de gastos con filtros. */
export const getExpenses = async (
    params: ExpenseListParams = {}
): Promise<ExpenseListResponse> => {
    const response = await api.get<ApiPayload<ExpenseListResponse>>('/expenses', { params })
    return response.data.payload
}

/** Detalle de un gasto. */
export const getExpense = async (id: number): Promise<ExpenseRecord> => {
    const response = await api.get<ApiPayload<ExpenseRecord>>(`/expenses/${id}`)
    return response.data.payload
}

/** Registra un gasto (debita la fuente). */
export const createExpense = async (
    payload: CreateExpensePayload
): Promise<ExpenseRecord> => {
    const response = await api.post<ApiPayload<ExpenseRecord>>('/expenses', payload)
    return response.data.payload
}

/** Edita SOLO metadata (description/category/notes). */
export const updateExpense = async (
    id: number,
    payload: UpdateExpensePayload
): Promise<ExpenseRecord> => {
    const response = await api.put<ApiPayload<ExpenseRecord>>(`/expenses/${id}`, payload)
    return response.data.payload
}

/** Anula un gasto y revierte el balance de la fuente. SOLO owner. */
export const voidExpense = async (id: number): Promise<{ voided: true }> => {
    const response = await api.post<ApiPayload<{ voided: true }>>(`/expenses/${id}/void`)
    return response.data.payload
}

export * from './types'
