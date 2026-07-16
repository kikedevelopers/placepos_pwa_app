// Paridad byte-por-byte con placepos (api/requests/dashboard/types.ts y
// break-even-progress/types.ts). El backend pos_api refleja ese mismo contrato.

export type CashRegisterAccount = {
    id: number
    userName: string
    balance: number
}

export type BankAccount = {
    id: number
    name: string
    accountNumber: string
    balance: number
}

export type WalletAccount = {
    id: number
    name: string
    balance: number
}

export type CashAccountsBreakdown = {
    cashRegisters: CashRegisterAccount[]
    banks: BankAccount[]
    wallets: WalletAccount[]
    totals: {
        cashRegisters: number
        banks: number
        wallets: number
        grand: number
    }
}

export type TodaySummary = {
    date: string
    cashSales: number
    transferSales: number
    creditPaymentsCash: number
    creditPaymentsTransfer: number
    creditPaymentsTotal: number
    totalCollected: number
    /**
     * Facturación de pedidos del día (flag `include_orders_in_reports`; 0 cuando
     * está OFF). Con el flag ON el pedido cuenta como una venta normal: ya está
     * sumado dentro de `totalSales` y su ganancia dentro de `salesProfit`. No
     * entra a caja (`totalCollected`).
     */
    ordersTotal: number
    // Vista VENTAS del día (DEVENGADO): la venta a CRÉDITO cuenta como venta del
    // día por su valor íntegro. Alimenta el "Resumen de ventas del día" y las
    // tarjetas de Finanzas. NO tocan la caja (totalCollected/profit/surplus/
    // realProfit siguen base caja para la Meta del mes).
    creditSales: number // valor íntegro de los créditos generados hoy (= newCredits.total)
    totalSales: number // cashSales + transferSales + creditSales + ordersTotal
    salesProfit: number // ganancia DEVENGADA del día = contado + crédito + pedidos
    salesSurplus: number // totalSales − salesProfit
    salesRealProfit: number // salesProfit − gastos
    profit: number // CAJA (cobrada)
    surplus: number // CAJA
    expenses: number
    realProfit: number // CAJA
    salesCount: number
    newCredits: {
        count: number
        total: number
        // Ganancia DEVENGADA de los créditos del día (discriminada).
        profit: number
    }
    purchases: {
        count: number
        total: number
        paymentsCash: number
        paymentsTransfer: number
        paymentsTotal: number
        supplierDebt: number
        todayCreditsBalance?: number
    }
    cashAccounts: CashAccountsBreakdown
}

export type CashierSummary = {
    userId: number
    userName: string
    cashSales: number
    transferSales: number
    // Valor DEVENGADO de los créditos generados por el cajero (venta a crédito =
    // venta). Discriminado; suma a totalSales.
    creditSales: number
    // Ganancia y margen POR MÉTODO (para el desglose). La suma cashProfit +
    // transferProfit + creditProfit = profit.
    cashProfit: number
    cashMargin: number
    transferProfit: number
    transferMargin: number
    creditProfit: number
    creditMargin: number
    creditPaymentsCash: number
    creditPaymentsTransfer: number
    creditPaymentsTotal: number
    totalCollected: number
    // Total VENTAS del cajero = contado + consignación + crédito. Los abonos
    // (creditPayments*, Recaudo de Cartera) quedan APARTE (no aquí).
    totalSales: number
    profit: number
    margin: number
    surplus: number
    salesCount: number
    newCredits: {
        count: number
        total: number
    }
}

export type TodayByCashier = {
    date: string
    cashiers: CashierSummary[]
    totals: {
        cashSales: number
        transferSales: number
        creditSales: number
        creditPaymentsCash: number
        creditPaymentsTransfer: number
        creditPaymentsTotal: number
        totalCollected: number
        totalSales: number
        profit: number
        margin: number
        surplus: number
        salesCount: number
        newCreditsCount: number
        newCreditsTotal: number
    }
}

export type BreakEvenProgress = {
    configured: boolean
    breakEvenAmount: number
    breakEvenPeriodDays: number
    dailyTarget: number
    monthFrom: string
    monthTo: string
    monthRealProfit: number
    monthProgress: number
    dayRealProfit: number
    dayProgress: number
}

export type ApiPayload<T> = {
    success: boolean
    payload: T
    error?: string
}

export type GetTodaySummaryResponse = ApiPayload<TodaySummary>
export type GetTodayByCashierResponse = ApiPayload<TodayByCashier>
export type GetBreakEvenProgressResponse = ApiPayload<BreakEvenProgress>
