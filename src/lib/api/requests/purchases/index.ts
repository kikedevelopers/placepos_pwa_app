import api from '$lib/api/config'
import type { ApiPayload } from '$lib/api/requests/dashboard/types'
import type {
    AddPurchasePaymentPayload,
    Purchase,
    PurchaseDetail,
    ReceivePurchasePayload
} from './types'

// showAll=false → solo compras con saldo pendiente; true → todas (no anuladas).
export const getPurchases = async (showAll: boolean): Promise<Purchase[]> => {
    const response = await api.get<ApiPayload<Purchase[]>>('/purchases', {
        params: showAll ? { showAll: 'true' } : undefined
    })
    return response.data.payload
}

/** Detalle completo de una compra (líneas + credit + abonos + transporte). */
export const getPurchase = async (id: number): Promise<PurchaseDetail> => {
    const response = await api.get<ApiPayload<PurchaseDetail>>(`/purchases/${id}`)
    return response.data.payload
}

/** Registra un abono a la compra (debita la fuente). Devuelve la compra actualizada. */
export const addPurchasePayment = async (
    id: number,
    payload: AddPurchasePaymentPayload
): Promise<PurchaseDetail> => {
    const response = await api.post<ApiPayload<PurchaseDetail>>(
        `/purchases/${id}/payments`,
        payload
    )
    return response.data.payload
}

/** Marca la compra como recibida y carga la mercancía al inventario. */
export const receivePurchase = async (
    id: number,
    payload: ReceivePurchasePayload
): Promise<PurchaseDetail> => {
    const response = await api.put<ApiPayload<PurchaseDetail>>(
        `/purchases/${id}/receive`,
        payload
    )
    return response.data.payload
}

export * from './types'
