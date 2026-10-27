import { describe, expect, it } from 'vitest'
import {
    isPreviewCard,
    parseCard,
    parseCards,
    settledStatus,
    type PurchaseCreatedCard,
    type PurchasePreviewCard
} from './cards'
import { costChange, describeIva, describePackaging, purchasePreviewState } from './purchase-cards'
import { parseStreamFrame } from './sse'

/**
 * La compra armada desde una factura se dibuja con los datos del servidor:
 * un payload dudoso NO se muestra (mejor ninguna compra que una mal).
 */
const LINE = {
    product_name: 'ACEITE GIRASOL 1L',
    sku_code: 'ACE-001',
    packaging_name: 'Caja',
    packaging_value: 12,
    quantity: 3,
    unit_cost: 96000,
    iva_rate: 19,
    subtotal: 288000,
    iva_amount: 54720,
    total: 342720,
    source_description: 'ACEITE GIRASOL X 1000ML CJ12',
    last_cost: 92000
}

const PREVIEW = {
    supplier: { name: 'DISTRIBUIDORA EL SOL', document: '900123456-1' },
    invoice_reference: 'FE-8812',
    lines: [LINE],
    excluded: [{ description: 'FLETE', reason: 'No es un producto' }],
    warnings: ['El total de la factura difiere en $100'],
    subtotal: 288000,
    iva_total: 54720,
    total: 342720,
    expires_at: '2026-10-27T13:00:00.000Z'
}

const CREATED = {
    purchase_id: 55,
    purchase_number: 'COMP-0055',
    supplier_name: 'DISTRIBUIDORA EL SOL',
    lines_count: 1,
    total: 342720,
    status: 'PENDING'
}

describe('parseCard · purchase_preview', () => {
    it('payload del servidor → tarjeta pendiente con los datos exactos', () => {
        expect(parseCard({ kind: 'purchase_preview', data: PREVIEW })).toEqual({
            kind: 'purchase_preview',
            ...PREVIEW,
            status: 'pending'
        })
    })

    it('campos opcionales nulos o ausentes → null / listas vacías', () => {
        const card = parseCard({
            kind: 'purchase_preview',
            data: {
                ...PREVIEW,
                supplier: { name: 'PROVEEDOR', document: null },
                invoice_reference: null,
                excluded: undefined,
                warnings: undefined,
                lines: [{ ...LINE, sku_code: null, packaging_name: null, last_cost: null }]
            }
        }) as PurchasePreviewCard
        expect(card.supplier.document).toBeNull()
        expect(card.invoice_reference).toBeNull()
        expect(card.excluded).toEqual([])
        expect(card.warnings).toEqual([])
        expect(card.lines[0]).toMatchObject({ sku_code: null, packaging_name: null, last_cost: null })
    })

    it('textos vacíos en opcionales → null', () => {
        const card = parseCard({
            kind: 'purchase_preview',
            data: { ...PREVIEW, invoice_reference: '  ', lines: [{ ...LINE, sku_code: '' }] }
        }) as PurchasePreviewCard
        expect(card.invoice_reference).toBeNull()
        expect(card.lines[0].sku_code).toBeNull()
    })

    it('descarta excluidos y avisos mal formados sin tirar la tarjeta', () => {
        const card = parseCard({
            kind: 'purchase_preview',
            data: {
                ...PREVIEW,
                excluded: [{ description: 'BOLSA', reason: 'Sin match' }, { reason: 'x' }, 'basura'],
                warnings: ['ok', 7, '']
            }
        }) as PurchasePreviewCard
        expect(card.excluded).toEqual([{ description: 'BOLSA', reason: 'Sin match' }])
        expect(card.warnings).toEqual(['ok'])
    })

    it.each([
        ['sin proveedor', { ...PREVIEW, supplier: null }],
        ['proveedor sin nombre', { ...PREVIEW, supplier: { name: ' ', document: null } }],
        ['documento numérico', { ...PREVIEW, supplier: { name: 'X', document: 900 } }],
        ['factura numérica', { ...PREVIEW, invoice_reference: 8812 }],
        ['sin líneas', { ...PREVIEW, lines: [] }],
        ['líneas no arreglo', { ...PREVIEW, lines: 'x' }],
        ['total como texto', { ...PREVIEW, total: '342720' }],
        ['subtotal NaN', { ...PREVIEW, subtotal: Number.NaN }],
        ['iva_total ausente', { ...PREVIEW, iva_total: undefined }],
        ['sin vencimiento', { ...PREVIEW, expires_at: undefined }],
        ['vencimiento inválido', { ...PREVIEW, expires_at: 'mañana' }],
        ['excluidos no arreglo', { ...PREVIEW, excluded: 'FLETE' }],
        ['línea sin producto', { ...PREVIEW, lines: [{ ...LINE, product_name: '' }] }],
        ['cantidad 0', { ...PREVIEW, lines: [{ ...LINE, quantity: 0 }] }],
        ['cantidad negativa', { ...PREVIEW, lines: [{ ...LINE, quantity: -1 }] }],
        ['empaque 0', { ...PREVIEW, lines: [{ ...LINE, packaging_value: 0 }] }],
        ['costo negativo', { ...PREVIEW, lines: [{ ...LINE, unit_cost: -5 }] }],
        ['IVA negativo', { ...PREVIEW, lines: [{ ...LINE, iva_rate: -19 }] }],
        ['total de línea null', { ...PREVIEW, lines: [{ ...LINE, total: null }] }],
        ['iva_amount texto', { ...PREVIEW, lines: [{ ...LINE, iva_amount: '1' }] }],
        ['sin descripción original', { ...PREVIEW, lines: [{ ...LINE, source_description: undefined }] }],
        ['último costo texto', { ...PREVIEW, lines: [{ ...LINE, last_cost: '92000' }] }],
        ['sku numérico', { ...PREVIEW, lines: [{ ...LINE, sku_code: 1 }] }],
        ['una línea buena y una mala', { ...PREVIEW, lines: [LINE, { ...LINE, subtotal: undefined }] }]
    ])('%s → se descarta', (_label, data) => {
        expect(parseCard({ kind: 'purchase_preview', data })).toBeNull()
    })

    it('la guardada (aplanada) conserva su estado', () => {
        const stored = parseCards([
            { kind: 'purchase_preview', ...PREVIEW, status: 'confirmed' },
            { kind: 'purchase_preview', broken: true }
        ])
        expect(stored).toHaveLength(1)
        expect((stored?.[0] as PurchasePreviewCard).status).toBe('confirmed')
    })
})

describe('parseCard · purchase_created', () => {
    it('payload válido → tarjeta', () => {
        expect(parseCard({ kind: 'purchase_created', data: CREATED })).toEqual({
            kind: 'purchase_created',
            ...CREATED
        })
    })

    it('la guardada (aplanada) se revalida igual', () => {
        expect(parseCards([{ kind: 'purchase_created', ...CREATED }])).toHaveLength(1)
    })

    it.each([
        ['id 0', { ...CREATED, purchase_id: 0 }],
        ['id decimal', { ...CREATED, purchase_id: 1.5 }],
        ['id texto', { ...CREATED, purchase_id: '55' }],
        ['sin número', { ...CREATED, purchase_number: '' }],
        ['sin proveedor', { ...CREATED, supplier_name: undefined }],
        ['líneas negativas', { ...CREATED, lines_count: -1 }],
        ['líneas decimales', { ...CREATED, lines_count: 1.5 }],
        ['total texto', { ...CREATED, total: '1' }],
        ['estado distinto', { ...CREATED, status: 'RECEIVED' }],
        ['sin estado', { ...CREATED, status: undefined }]
    ])('%s → se descarta', (_label, data) => {
        expect(parseCard({ kind: 'purchase_created', data })).toBeNull()
    })
})

describe('ciclo de vida de la vista previa de compra', () => {
    const preview = parseCard({ kind: 'purchase_preview', data: PREVIEW }) as PurchasePreviewCard
    const created = parseCard({ kind: 'purchase_created', data: CREATED }) as PurchaseCreatedCard

    it('es una vista previa (espera el "sí")', () => {
        expect(isPreviewCard(preview)).toBe(true)
        expect(isPreviewCard(created)).toBe(false)
    })

    it('la compra creada confirma la vista previa de compra', () => {
        expect(settledStatus(created, preview)).toBe('confirmed')
    })

    it('una nueva vista previa (de lo que sea) la reemplaza', () => {
        expect(settledStatus(preview, preview)).toBe('superseded')
    })

    it('la compra creada NO toca una vista previa de pedido pendiente', () => {
        const sale = parseCard({
            kind: 'sale_preview',
            data: {
                customer: 'M',
                lines: [{ line: 1, product: 'P', quantity: 1, unit_price: 1, total: 1 }],
                total: 1
            }
        })
        expect(sale && isPreviewCard(sale) && settledStatus(created, sale)).toBeNull()
    })

    it('un pedido creado NO confirma la vista previa de compra', () => {
        expect(
            settledStatus(
                { kind: 'sale_created', sale_id: 1, ticket_number: 'P', customer: 'M', lines: 1, total: 1 },
                preview
            )
        ).toBeNull()
    })
})

describe('purchasePreviewState', () => {
    const now = Date.parse('2026-10-27T12:00:00.000Z')

    it('pendiente y vigente → pending', () => {
        expect(purchasePreviewState({ status: 'pending', expires_at: '2026-10-27T13:00:00.000Z' }, now)).toBe('pending')
    })

    it('pendiente pero vencida → expired', () => {
        expect(purchasePreviewState({ status: 'pending', expires_at: '2026-10-27T11:00:00.000Z' }, now)).toBe('expired')
    })

    it('confirmada o reemplazada no cambian aunque haya vencido', () => {
        const past = '2026-10-27T11:00:00.000Z'
        expect(purchasePreviewState({ status: 'confirmed', expires_at: past }, now)).toBe('confirmed')
        expect(purchasePreviewState({ status: 'superseded', expires_at: past }, now)).toBe('superseded')
    })
})

describe('costChange (último costo de referencia)', () => {
    it('subió → up con diferencia y %', () => {
        expect(costChange({ unit_cost: 96000, last_cost: 92000 })).toEqual({
            direction: 'up',
            difference: 4000,
            percent: 4.3
        })
    })

    it('bajó → down', () => {
        expect(costChange({ unit_cost: 90000, last_cost: 100000 })).toEqual({
            direction: 'down',
            difference: -10000,
            percent: -10
        })
    })

    it('igual (incluso con decimales de coma flotante) → sin cambio', () => {
        expect(costChange({ unit_cost: 0.1 + 0.2, last_cost: 0.3 })).toBeNull()
        expect(costChange({ unit_cost: 5000, last_cost: 5000 })).toBeNull()
    })

    it('sin referencia → null', () => {
        expect(costChange({ unit_cost: 5000, last_cost: null })).toBeNull()
    })

    it('último costo 0 → cambio sin porcentaje', () => {
        expect(costChange({ unit_cost: 5000, last_cost: 0 })).toEqual({
            direction: 'up',
            difference: 5000,
            percent: null
        })
    })
})

describe('describePackaging / describeIva', () => {
    it.each([
        [{ packaging_name: 'Caja', packaging_value: 12 }, 'Caja x12'],
        [{ packaging_name: 'Unidad', packaging_value: 1 }, 'Unidad'],
        [{ packaging_name: null, packaging_value: 24 }, 'x24'],
        [{ packaging_name: null, packaging_value: 1 }, ''],
        [{ packaging_name: 'Bulto', packaging_value: 2.5 }, 'Bulto x2,5']
    ])('%j → %p', (line, expected) => {
        expect(describePackaging(line)).toBe(expected)
    })

    it('IVA', () => {
        expect(describeIva(19)).toBe('IVA 19%')
        expect(describeIva(5)).toBe('IVA 5%')
        expect(describeIva(0)).toBe('Sin IVA')
    })
})

describe('evento SSE card de compra', () => {
    it('trama válida → evento; inválida → se ignora', () => {
        expect(
            parseStreamFrame({ event: 'card', data: JSON.stringify({ card: { kind: 'purchase_preview', data: PREVIEW } }) })
                ?.type
        ).toBe('card')
        expect(
            parseStreamFrame({ event: 'card', data: JSON.stringify({ card: { kind: 'purchase_created', data: CREATED } }) })
                ?.type
        ).toBe('card')
        expect(
            parseStreamFrame({ event: 'card', data: JSON.stringify({ card: { kind: 'purchase_preview', data: {} } }) })
        ).toBeNull()
    })
})
