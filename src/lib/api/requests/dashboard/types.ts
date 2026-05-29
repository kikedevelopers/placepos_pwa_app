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
    profit: number
    surplus: number
    expenses: number
    realProfit: number
    salesCount: number
    newCredits: {
        count: number
        total: number
    }
    purchases: {
        count: number
        total: number
        paymentsCash: number
        paymentsTransfer: number
        paymentsTotal: number
        supplierDebt: number
    }
    cashAccounts: CashAccountsBreakdown
}

export type CashierSummary = {
    userId: number
    userName: string
    cashSales: number
    transferSales: number
    creditPaymentsCash: number
    creditPaymentsTransfer: number
    creditPaymentsTotal: number
    totalCollected: number
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
        creditPaymentsCash: number
        creditPaymentsTransfer: number
        creditPaymentsTotal: number
        totalCollected: number
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
