import { describe, expect, it } from 'vitest'
import { parseCard, parseCards, settledStatus, type SalePreviewCard } from './cards'
import { parseStreamFrame } from './sse'

/**
 * La vista previa del pedido se dibuja con los datos del servidor: un payload
 * dudoso NO se muestra (mejor ninguna factura que una mal).
 */
const SUMMARY = {
    customer: 'MARÍA MUÑOZ',
    lines: [
        {
            line: 1,
            product: 'FECULA DE MAIZ X LIBRA',
            size: 'libra',
            quantity: 2,
            unit_price: 4500,
            price_label: 'Base',
            total: 9000,
            note: null
        }
    ],
    total: 9000,
    warnings: ['Existencias bajas']
}

describe('parseCard', () => {
    it('vista previa del servidor → tarjeta pendiente con los datos exactos', () => {
        expect(parseCard({ kind: 'sale_preview', data: SUMMARY })).toEqual({
            kind: 'sale_preview',
            ...SUMMARY,
            status: 'pending'
        })
    })

    it('pedido creado', () => {
        expect(
            parseCard({
                kind: 'sale_created',
                data: {
                    ticket_number: 'PED-001',
                    customer: 'MARÍA',
                    lines: 2,
                    total: 15500
                }
            })
        ).toMatchObject({
            kind: 'sale_created',
            ticket_number: 'PED-001',
            total: 15500
        })
    })

    it.each([
        ['tipo desconocido', { kind: 'otra', data: SUMMARY }],
        ['sin líneas', { kind: 'sale_preview', data: { ...SUMMARY, lines: [] } }],
        ['total como texto', { kind: 'sale_preview', data: { ...SUMMARY, total: '9000' } }],
        [
            'línea inválida',
            {
                kind: 'sale_preview',
                data: { ...SUMMARY, lines: [{ ...SUMMARY.lines[0], total: null }] }
            }
        ],
        ['pedido sin ticket', { kind: 'sale_created', data: { customer: 'X', total: 1 } }],
        ['null', null]
    ])('%s → se descarta', (_label, raw) => {
        expect(parseCard(raw)).toBeNull()
    })

    it('las guardadas conservan su estado y las corruptas se descartan', () => {
        const stored = parseCards([
            { kind: 'sale_preview', ...SUMMARY, status: 'confirmed' },
            { kind: 'sale_preview', broken: true }
        ])
        expect(stored).toHaveLength(1)
        expect((stored?.[0] as SalePreviewCard).status).toBe('confirmed')
        expect(parseCards('basura')).toBeUndefined()
    })

    it('una vista previa nueva reemplaza; un pedido creado confirma', () => {
        expect(settledStatus({ kind: 'sale_preview', ...SUMMARY, status: 'pending' })).toBe(
            'superseded'
        )
        expect(
            settledStatus({
                kind: 'sale_created',
                ticket_number: 'P',
                customer: 'M',
                lines: 1,
                total: 1
            })
        ).toBe('confirmed')
    })
})

describe('evento SSE card', () => {
    it('trama válida → evento tipado; inválida → se ignora', () => {
        expect(
            parseStreamFrame({
                event: 'card',
                data: JSON.stringify({ card: { kind: 'sale_preview', data: SUMMARY } })
            })?.type
        ).toBe('card')
        expect(
            parseStreamFrame({
                event: 'card',
                data: JSON.stringify({ card: { kind: 'sale_preview' } })
            })
        ).toBeNull()
    })
})
