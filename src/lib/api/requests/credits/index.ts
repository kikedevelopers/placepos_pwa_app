import api from '$lib/api/config'
import type { ApiPayload } from '$lib/api/requests/dashboard/types'

/** Abono a un crédito pendiente (espejo de `POST /credits` en pos_api). */
export type ProcessCreditPaymentPayload = {
    invoice_id: number
    payment_method: 'CASH' | 'TRANSFER'
    amount: number
    bank_id: number | null
    bank_name: string | null
}

export type ProcessCreditPaymentResult = {
    success: boolean
    message: string
    payment_id: number | null
    credit_status: 'PENDING' | 'PARTIAL' | 'PAID' | null
    credit_balance: number | null
}

export const processCreditPayment = async (
    payload: ProcessCreditPaymentPayload
): Promise<ProcessCreditPaymentResult> => {
    const response = await api.post<ApiPayload<ProcessCreditPaymentResult>>('/credits', payload)
    return response.data.payload
}
