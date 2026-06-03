import api from '$lib/api/config'
import type { ApiPayload } from '$lib/api/requests/dashboard/types'

interface NamedAccount {
    id: number
    nombre: string
    balance: number
}

export interface ExtendedSummaryResult {
    from: string
    to: string
    ventas: {
        efectivo: number
        electronico: number
        credito: number
        total: number
        ganancia: number
        margen: number
    }
    gastos: { total: number }
    gananciaReal: number
    cartera: { balance: number; count: number }
    compras: {
        total: number
        saldosPorPagar: number
        pagosElectronicos: number
        pagosEfectivo: number
        recibidas: { count: number; total: number }
        noRecibidas: { count: number; total: number }
        abonosTransportistas: number
        abonosTransportistasPendientes: number
    }
    cajas: {
        registros: NamedAccount[]
        bancos: NamedAccount[]
        wallets: NamedAccount[]
        totales: { cajas: number; bancos: number; wallets: number; total: number }
    }
}

export interface ExtendedSummaryParams {
    from?: string
    to?: string
}

export const getExtendedSummary = async (
    params: ExtendedSummaryParams = {}
): Promise<ExtendedSummaryResult> => {
    const response = await api.get<ApiPayload<ExtendedSummaryResult>>('/reports/extended-summary', {
        params
    })
    return response.data.payload
}
