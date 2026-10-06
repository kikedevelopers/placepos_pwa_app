import { describe, it, expect } from 'vitest'
import { buildReceipt } from './receipt'
import type { SaleDetail } from '$lib/api/requests/sales'

// ---------------------------------------------------------------------------
// Recibo en texto (e-recibo). La línea "Documento:" del cliente se incluye SOLO
// cuando hay número de documento (CC/NIT): en consumidor final o cliente sin
// documento no aparece. Cuando aparece, va justo debajo del nombre del cliente.
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

describe('buildReceipt · documento del cliente', () => {
    it('incluye "Documento: X" cuando el cliente tiene documento', () => {
        const text = buildReceipt(baseSale({ customerDocNumber: '1098765432' }), 'ESENCIA & GRANO')
        expect(text).toContain('Documento: 1098765432')
    })

    it('la línea del documento va justo debajo del cliente', () => {
        const text = buildReceipt(baseSale({ customerDocNumber: '1098765432' }), 'ESENCIA & GRANO')
        const rows = text.split('\n')
        const idxCliente = rows.findIndex((r) => r.startsWith('Cliente:'))
        expect(rows[idxCliente + 1]).toBe('Documento: 1098765432')
    })

    it('NO incluye la línea cuando el cliente no tiene documento', () => {
        const text = buildReceipt(baseSale(), 'ESENCIA & GRANO')
        expect(text).not.toContain('Documento:')
    })

    it('NO incluye la línea en consumidor final (doc null)', () => {
        const text = buildReceipt(
            baseSale({ customerName: 'CONSUMIDOR FINAL', customerDocNumber: null }),
            'ESENCIA & GRANO'
        )
        expect(text).not.toContain('Documento:')
    })

    it('trata el documento en blanco como ausente', () => {
        const text = buildReceipt(baseSale({ customerDocNumber: '   ' }), 'ESENCIA & GRANO')
        expect(text).not.toContain('Documento:')
    })

    it('recorta los espacios sobrantes del documento', () => {
        const text = buildReceipt(baseSale({ customerDocNumber: '  900123456-7  ' }), 'ESENCIA & GRANO')
        expect(text).toContain('Documento: 900123456-7')
    })
})
