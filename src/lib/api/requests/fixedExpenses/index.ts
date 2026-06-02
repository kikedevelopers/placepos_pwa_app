import api from '$lib/api/config'
import type { ApiPayload } from '$lib/api/requests/dashboard/types'
import type {
    CreateFixedExpensePayload,
    FixedExpense,
    FixedExpensePeriod,
    PayFixedExpensePeriodPayload,
    UpdateFixedExpensePayload
} from './types'

/** Listado de gastos fijos (con stats de cortes pendientes por gasto). */
export const getFixedExpenses = async (): Promise<FixedExpense[]> => {
    const response = await api.get<ApiPayload<FixedExpense[]>>('/fixed-expenses')
    return response.data.payload
}

/** Detalle de un gasto fijo. */
export const getFixedExpense = async (id: number): Promise<FixedExpense> => {
    const response = await api.get<ApiPayload<FixedExpense>>(`/fixed-expenses/${id}`)
    return response.data.payload
}

/** Crea un gasto fijo. */
export const createFixedExpense = async (
    payload: CreateFixedExpensePayload
): Promise<FixedExpense> => {
    const response = await api.post<ApiPayload<FixedExpense>>('/fixed-expenses', payload)
    return response.data.payload
}

/** Edita un gasto fijo. */
export const updateFixedExpense = async (
    id: number,
    payload: UpdateFixedExpensePayload
): Promise<FixedExpense> => {
    const response = await api.put<ApiPayload<FixedExpense>>(`/fixed-expenses/${id}`, payload)
    return response.data.payload
}

/** Archiva (soft-delete) un gasto fijo. */
export const archiveFixedExpense = async (
    id: number
): Promise<{ archived: boolean }> => {
    const response = await api.put<ApiPayload<{ archived: boolean }>>(
        `/fixed-expenses/${id}/archive`
    )
    return response.data.payload
}

/** Lista los cortes (periods) de un gasto fijo. */
export const getFixedExpensePeriods = async (
    id: number
): Promise<FixedExpensePeriod[]> => {
    const response = await api.get<ApiPayload<FixedExpensePeriod[]>>(
        `/fixed-expenses/${id}/periods`
    )
    return response.data.payload
}

/** Marca un corte como pagado (materializa el gasto desde la fuente). */
export const payFixedExpensePeriod = async (
    id: number,
    periodId: number,
    payload: PayFixedExpensePeriodPayload
): Promise<FixedExpensePeriod> => {
    const response = await api.put<ApiPayload<FixedExpensePeriod>>(
        `/fixed-expenses/${id}/periods/${periodId}/pay`,
        payload
    )
    return response.data.payload
}

export * from './types'
