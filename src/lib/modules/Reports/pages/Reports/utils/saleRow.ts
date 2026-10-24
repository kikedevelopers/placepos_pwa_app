import type { SalesReportTicket } from '$lib/api/requests/reports/types'
import type { Tone } from '$lib/components/premium/tones'

/**
 * Cómo se presenta una fila del informe de Ventas. Pura: la fila solo pinta.
 * Misma clasificación que placepos (VEN / PED / NC / ND, contado vs crédito).
 */
export interface SaleRowModel {
    /** Sigla del icono (V, P, NC, ND). */
    glyph: string
    kindLabel: string
    tone: Tone
    number: string
    paymentLabel: string
    /** Factura que abre el visor: la propia o, en una nota, su factura padre. */
    invoiceId: number | null
    voided: boolean
}

const PAYMENT_LABEL: Record<SalesReportTicket['paymentType'], string> = {
    CASH: 'Efectivo',
    TRANSFER: 'Consignación',
    CREDIT: 'Crédito',
    MIXED: 'Pago mixto',
    UNDEFINED: 'Sin pago'
}

export function saleRowModel(t: SalesReportTicket): SaleRowModel {
    const isNote = t.rowType === 'NOTE'
    const isCreditNote = isNote && t.noteType === 'CREDIT'
    const isOrder = !isNote && t.ticketType === 'ORDER'

    const kind = isNote
        ? isCreditNote
            ? { glyph: 'NC', kindLabel: 'Nota crédito', tone: 'warning' as Tone }
            : { glyph: 'ND', kindLabel: 'Nota débito', tone: 'brand' as Tone }
        : isOrder
          ? { glyph: 'P', kindLabel: 'Pedido', tone: 'warning' as Tone }
          : { glyph: 'V', kindLabel: 'Venta', tone: 'positive' as Tone }

    const paymentLabel = isNote
        ? 'Ajuste'
        : isOrder
          ? 'Por cobrar'
          : t.isPending
            ? 'Saldo pendiente'
            : t.isCredit
              ? 'Crédito'
              : (PAYMENT_LABEL[t.paymentType] ?? 'Contado')

    return {
        ...kind,
        number: (isNote ? t.noteNumber : (t.saleNumber ?? t.ticketNumber)) ?? '—',
        paymentLabel,
        invoiceId: isNote ? t.parentInvoiceId : t.id,
        voided: t.isDeleted
    }
}
