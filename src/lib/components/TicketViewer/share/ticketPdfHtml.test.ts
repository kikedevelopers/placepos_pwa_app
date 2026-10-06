import { describe, it, expect } from 'vitest'
import { buildTicketPdfHtml } from './ticketPdfHtml'
import type { SaleDetail } from '$lib/api/requests/sales'

// ---------------------------------------------------------------------------
// PDF (HTML) del ticket. La línea "Documento:" del cliente se pinta SOLO cuando
// hay número de documento, dentro de la caja "Datos del Cliente".
// ---------------------------------------------------------------------------

const baseSale = (patch: Partial<SaleDetail> = {}): SaleDetail => ({
    id: 1,
    ticketType: 'SALE',
    ticketNumber: 'VTA-1',
    saleNumber: 'VTA-1',
    total: 4000,
    cost: 2000,
    profit: 2000,
    margin: 50,
    customerName: 'JUAN PÉREZ',
    notes: null,
    createdBy: 'DIANA BOLAÑOS',
    createdAt: '2026-10-06T12:00:00.000Z',
    lines: [{ id: 1, name: 'ACHIOTE PEPA', quantity: 2, price: 2000, total: 4000, note: null }],
    payments: [],
    credit: null,
    ...patch
})

describe('buildTicketPdfHtml · documento del cliente', () => {
    it('pinta "Documento: X" cuando el cliente tiene documento', () => {
        const html = buildTicketPdfHtml(baseSale({ customerDocNumber: '1098765432' }), null)
        expect(html).toContain('Documento: ')
        expect(html).toContain('1098765432')
    })

    it('NO pinta la línea cuando el cliente no tiene documento', () => {
        const html = buildTicketPdfHtml(baseSale(), null)
        expect(html).not.toContain('Documento: ')
    })

    it('NO pinta la línea en consumidor final (doc null)', () => {
        const html = buildTicketPdfHtml(
            baseSale({ customerName: 'CONSUMIDOR FINAL', customerDocNumber: null }),
            null
        )
        expect(html).not.toContain('Documento: ')
    })

    it('escapa el documento (no inyecta HTML crudo)', () => {
        const html = buildTicketPdfHtml(baseSale({ customerDocNumber: '<b>12</b>' }), null)
        expect(html).not.toContain('<b>12</b>')
        expect(html).toContain('&lt;b&gt;12&lt;/b&gt;')
    })
})
