// Paridad con placepos (api/requests/{sales-report,credits-report,reports}/types.ts).
// pos_api refleja el mismo contrato (POST/GET con payload envuelto).

// ---- Reporte de Ventas (GET /pos-reports/sales) ----

export type SalesReportTicket = {
    id: number
    rowType: 'INVOICE' | 'NOTE'
    ticketType: string
    ticketNumber: string
    saleNumber: string | null
    originalTotal: number
    consolidatedTotal: number
    cost: number
    profit: number
    margin: number
    customerName: string
    createdBy: string | null
    synced: boolean
    isDeleted: boolean
    notesCount: number
    noteTypes: string | null
    createdAt: string
    noteNumber: string | null
    noteType: string | null
    operationType: string | null
    parentInvoiceId: number | null
    isCredit: boolean
    creditBalance: number
    creditStatus: string | null
}

export type SalesReportSummary = {
    total_sales_count: number
    total_notes_count: number
    total_orders_count: number
    total_voided_count: number
    total_partial_void_count: number
    total_debit_note_count: number
    total_revenue: number
    total_cost: number
    total_profit: number
    average_margin: number
}

export type SalesReportResponse = {
    tickets: SalesReportTicket[]
    summary: SalesReportSummary
}

// ---- Reporte de Créditos (GET /reports/credits) ----

export type CreditStatus = 'PENDING' | 'PARTIALLY_PAID' | 'PAID'

export type CreditReportItem = {
    id: number
    creditId: number | null
    ticketNumber: string
    saleNumber: string | null
    customerName: string
    createdBy: string | null
    synced: boolean
    createdAt: string
    totalAmount: number
    paidAmount: number
    balance: number
    status: CreditStatus
    dueDate: string | null
}

export type CreditsReportSummary = {
    total_credits_count: number
    pending_count: number
    partial_count: number
    paid_count: number
    total_amount: number
    total_paid: number
    total_balance: number
}

export type CreditsReportResponse = {
    credits: CreditReportItem[]
    summary: CreditsReportSummary
}

// ---- Resumen del día / Cierre (GET /reports/daily-closure) ----

export type BankDetail = {
    bankName: string
    amount: number
}

export type AdjustmentNote = {
    noteNumber: string
    noteType: string
    operationType: string
    total: number
    originalInvoiceNumber: string
    originalInvoiceDate: string
    customerName: string
}

export type DailyClosure = {
    date: string
    cashSalesTotal: number
    salesBreakdown: {
        grossSales: number
        creditNotes: number
        debitNotes: number
        netSales: number
    }
    consignacionesVentas: number
    consignacionesDetalle: BankDetail[]
    creditsBreakdown: {
        newCreditsCount: number
        newCreditsTotal: number
        abonosCash: number
        abonosConsignacion: number
        abonosConsignacionDetalle: BankDetail[]
        abonosTotal: number
        pendingBalance: number
    }
    expensesTotal: number
    finalTotal: number
    profit: number
    margin: number
    salesProfit: number
    salesMargin: number
    creditsProfit: number
    creditsMargin: number
    totalPendingCredits: {
        count: number
        totalAmount: number
        paidAmount: number
        balance: number
    }
    adjustmentNotes: AdjustmentNote[]
    adjustmentNotesSummary: {
        count: number
        totalCredit: number
        totalDebit: number
    }
}
