import type { SaleDetail } from '$lib/api/requests/sales'
import { formatCurrency, formatNumber } from '$lib/utils/numbers'
import { formatDateTime } from '$lib/utils/dates'

const METHOD_LABEL: Record<string, string> = {
    CASH: 'Efectivo',
    TRANSFER: 'Transferencia',
    CREDIT: 'Crédito'
}

/** Recibo en texto plano para compartir (e-recibo) en lugar de impresión térmica. */
export const buildReceipt = (sale: SaleDetail, company: string): string => {
    const lines = sale.lines
        .map((l) => `${formatNumber(l.quantity)} x ${l.name}\n   ${formatCurrency(l.total)}`)
        .join('\n')
    const payments = sale.payments
        .map(
            (p) =>
                `${METHOD_LABEL[p.paymentMethod] ?? p.paymentMethod}: ${formatCurrency(p.amountPaid)}`
        )
        .join('\n')
    const change = sale.payments.find((p) => p.changeAmount > 0)
    const credit =
        sale.credit && sale.credit.balance > 0
            ? `\nCrédito (saldo): ${formatCurrency(sale.credit.balance)}\nVence: ${sale.credit.dueDate || '—'}`
            : ''

    return [
        company || 'Recibo',
        `${sale.ticketType === 'SALE' ? 'Venta' : 'Pedido'} ${sale.saleNumber ?? sale.ticketNumber}`,
        formatDateTime(sale.createdAt),
        `Cliente: ${sale.customerName}`,
        '--------------------------------',
        lines,
        '--------------------------------',
        `TOTAL: ${formatCurrency(sale.total)}`,
        payments,
        change ? `Cambio: ${formatCurrency(change.changeAmount)}` : '',
        credit,
        sale.createdBy ? `\nAtendido por: ${sale.createdBy}` : ''
    ]
        .filter(Boolean)
        .join('\n')
}
