import api from '$lib/api/config'
import type { ApiPayload } from '$lib/api/requests/dashboard/types'
import type { Purchase } from './types'

// showAll=false → solo compras con saldo pendiente; true → todas (no anuladas).
export const getPurchases = async (showAll: boolean): Promise<Purchase[]> => {
    const response = await api.get<ApiPayload<Purchase[]>>('/purchases', {
        params: showAll ? { showAll: 'true' } : undefined
    })
    return response.data.payload
}

export * from './types'
