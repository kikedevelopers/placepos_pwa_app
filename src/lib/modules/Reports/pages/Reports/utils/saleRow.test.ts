import { describe, expect, it } from 'vitest'
import type { SalesReportTicket } from '$lib/api/requests/reports/types'
import { saleRowModel } from './saleRow'

const ticket = (over: Partial<SalesReportTicket> = {}): SalesReportTicket => ({
    id: 10,
    rowType: 'INVOICE',
    ticketType: 'SALE',
    ticketNumber: 'T-10',
    saleNumber: 'VTA-10',
    originalTotal: 1000,
    consolidatedTotal: 1000,
    cost: 600,
    profit: 400,
    margin: 40,
    customerName: 'Ana',
    createdBy: 'Kike',
    synced: true,
    isDeleted: false,
    notesCount: 0,
    noteTypes: null,
    createdAt: '2026-10-24T15:00:00.000Z',
    noteNumber: null,
    noteType: null,
    operationType: null,
    parentInvoiceId: null,
    isCredit: false,
    creditBalance: 0,
    creditStatus: null,
    balanceDue: 0,
    isPending: false,
    paymentType: 'CASH',
    ...over
})

describe('saleRowModel', () => {
    it('venta de contado: V verde, número de venta y medio de pago', () => {
        const m = saleRowModel(ticket())
        expect(m).toMatchObject({ glyph: 'V', tone: 'positive', number: 'VTA-10', paymentLabel: 'Efectivo', invoiceId: 10 })
    })

    it('sin número de venta usa el del ticket', () => {
        expect(saleRowModel(ticket({ saleNumber: null })).number).toBe('T-10')
    })

    it('medios de pago derivados', () => {
        expect(saleRowModel(ticket({ paymentType: 'TRANSFER' })).paymentLabel).toBe('Consignación')
        expect(saleRowModel(ticket({ paymentType: 'MIXED' })).paymentLabel).toBe('Pago mixto')
        expect(saleRowModel(ticket({ paymentType: 'UNDEFINED' })).paymentLabel).toBe('Sin pago')
    })

    it('venta a crédito y venta con saldo pendiente', () => {
        expect(saleRowModel(ticket({ isCredit: true, paymentType: 'CREDIT' })).paymentLabel).toBe('Crédito')
        expect(saleRowModel(ticket({ isPending: true, balanceDue: 300 })).paymentLabel).toBe('Saldo pendiente')
    })

    it('pedido: P ámbar, por cobrar', () => {
        expect(saleRowModel(ticket({ ticketType: 'ORDER' }))).toMatchObject({
            glyph: 'P',
            tone: 'warning',
            paymentLabel: 'Por cobrar'
        })
    })

    it('nota crédito abre la factura PADRE', () => {
        const m = saleRowModel(
            ticket({ rowType: 'NOTE', noteType: 'CREDIT', noteNumber: 'NC-3', parentInvoiceId: 7 })
        )
        expect(m).toMatchObject({ glyph: 'NC', tone: 'warning', number: 'NC-3', invoiceId: 7, paymentLabel: 'Ajuste' })
    })

    it('nota débito: ND de marca', () => {
        expect(saleRowModel(ticket({ rowType: 'NOTE', noteType: 'DEBIT', noteNumber: 'ND-1' })).glyph).toBe('ND')
    })

    it('nota sin factura padre no abre nada', () => {
        expect(saleRowModel(ticket({ rowType: 'NOTE', noteType: 'DEBIT', parentInvoiceId: null })).invoiceId).toBeNull()
    })

    it('marca las anuladas', () => {
        expect(saleRowModel(ticket({ isDeleted: true })).voided).toBe(true)
    })
})
