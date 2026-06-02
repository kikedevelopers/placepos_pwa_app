import api from '$lib/api/config'
import type { ApiPayload } from '$lib/api/requests/dashboard/types'
import type { CashSummary, CloseCashPayload, CloseCashResult, TransferDestinations } from './types'

export const getCashSummary = async (): Promise<CashSummary> => {
    const response = await api.get<ApiPayload<CashSummary>>('/pos-data/cash-summary')
    return response.data.payload
}

export const getTransferDestinations = async (): Promise<TransferDestinations> => {
    const response = await api.get<ApiPayload<{ destinations: TransferDestinations }>>(
        '/pos-data/transfer-destinations'
    )
    return response.data.payload.destinations
}

export const closeCash = async (
    payload: CloseCashPayload,
    idempotencyKey?: string
): Promise<CloseCashResult> => {
    const response = await api.post<ApiPayload<CloseCashResult>>('/pos-data/close-cash', payload, {
        headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined
    })
    return response.data.payload
}

export * from './types'
