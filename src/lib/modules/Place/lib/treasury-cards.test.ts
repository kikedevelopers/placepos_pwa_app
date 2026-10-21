import { beforeEach, describe, expect, it, vi } from 'vitest'
import { parseCard, parseCards, settledStatus, type AssistantCard, type PreviewCard } from './cards'

const invalidateQueries = vi.fn()
vi.mock('$lib/api/queryClient', () => ({ queryClient: { invalidateQueries } }))

/**
 * Tarjetas de tesorería (mover / corregir saldo) — espejo de placepos. Son
 * dinero real: un payload dudoso NO se muestra.
 */

const TRANSFER = {
    operation: 'transfer',
    amount: 100000,
    from: { name: 'NEQUI - 3117', kind: 'banco', balance: 750000, balance_after: 650000 },
    to: { name: 'Efectivo', kind: 'billetera', balance: 300000, balance_after: 400000 }
}

const ADJUST = {
    operation: 'adjust',
    account: { name: 'NEQUI - 3117', kind: 'banco' },
    balance: 650000,
    target_balance: 10000,
    difference: -640000,
    reason: 'Corrección con Place'
}

const transferPreview = (): PreviewCard => ({
    kind: 'treasury_preview',
    operation: 'transfer',
    amount: 100000,
    from: TRANSFER.from,
    to: TRANSFER.to,
    status: 'pending'
})

const salePreview: PreviewCard = {
    kind: 'sale_preview',
    customer: 'MARÍA',
    lines: [],
    total: 1,
    profit: null,
    margin: null,
    warnings: [],
    status: 'pending'
}

const ADJUST_DONE: AssistantCard = {
    kind: 'treasury_done',
    operation: 'adjust',
    account: { name: 'NEQUI' },
    balance: 10000,
    difference: -640000
}

describe('parseCard · tesorería', () => {
    it('traslado y corrección: vista previa pendiente con los datos exactos', () => {
        expect(parseCard({ kind: 'treasury_preview', data: TRANSFER })).toEqual(transferPreview())
        expect(parseCard({ kind: 'treasury_preview', data: ADJUST })).toEqual({
            kind: 'treasury_preview',
            ...ADJUST,
            status: 'pending'
        })
    })

    it('corrección a 0 es válida', () => {
        expect(
            parseCard({ kind: 'treasury_preview', data: { ...ADJUST, target_balance: 0, difference: -650000 } })
        ).toMatchObject({ operation: 'adjust', target_balance: 0 })
    })

    it('resultados de traslado y de corrección', () => {
        expect(
            parseCard({
                kind: 'treasury_done',
                data: {
                    operation: 'transfer',
                    amount: 100000,
                    from: { name: 'NEQUI', balance: 650000 },
                    to: { name: 'Efectivo', balance: 400000 }
                }
            })
        ).toMatchObject({ kind: 'treasury_done', operation: 'transfer', amount: 100000 })
        expect(
            parseCard({
                kind: 'treasury_done',
                data: { operation: 'adjust', account: { name: 'NEQUI' }, balance: 10000, difference: -640000 }
            })
        ).toEqual(ADJUST_DONE)
    })

    it.each([
        ['operación desconocida', { kind: 'treasury_preview', data: { ...TRANSFER, operation: 'x' } }],
        ['monto como texto', { kind: 'treasury_preview', data: { ...TRANSFER, amount: '100000' } }],
        ['monto cero', { kind: 'treasury_preview', data: { ...TRANSFER, amount: 0 } }],
        [
            'saldo no finito',
            { kind: 'treasury_preview', data: { ...TRANSFER, to: { ...TRANSFER.to, balance: Infinity } } }
        ],
        ['sin origen', { kind: 'treasury_preview', data: { ...TRANSFER, from: null } }],
        ['corrección sin diferencia', { kind: 'treasury_preview', data: { ...ADJUST, difference: 0 } }],
        ['saldo final negativo', { kind: 'treasury_preview', data: { ...ADJUST, target_balance: -1 } }],
        ['resultado sin saldo', { kind: 'treasury_done', data: { operation: 'adjust', account: { name: 'X' } } }]
    ])('%s → se descarta', (_label, raw) => {
        expect(parseCard(raw)).toBeNull()
    })

    it('las guardadas sobreviven con su estado y las corruptas se descartan', () => {
        const stored = parseCards([{ ...transferPreview(), status: 'confirmed' }, { kind: 'treasury_done' }])
        expect(stored).toEqual([{ ...transferPreview(), status: 'confirmed' }])
    })
})

describe('settledStatus · una pendiente por usuario', () => {
    it('una vista previa nueva (de cualquier tipo) reemplaza a cualquier pendiente', () => {
        expect(settledStatus(transferPreview(), salePreview)).toBe('superseded')
        expect(settledStatus(salePreview, transferPreview())).toBe('superseded')
    })

    it('el movimiento hecho confirma su vista previa, no la de un pedido', () => {
        expect(settledStatus(ADJUST_DONE, transferPreview())).toBe('confirmed')
        expect(settledStatus(ADJUST_DONE, salePreview)).toBeNull()
    })

    it('el pedido creado no confirma un movimiento pendiente', () => {
        const created: AssistantCard = {
            kind: 'sale_created',
            sale_id: 1,
            ticket_number: 'P',
            customer: 'M',
            lines: 1,
            total: 1
        }
        expect(settledStatus(created, transferPreview())).toBeNull()
        expect(settledStatus(created, salePreview)).toBe('confirmed')
    })
})

describe('refreshAfterCard', () => {
    beforeEach(() => invalidateQueries.mockReset())

    it('un movimiento hecho refresca bancos, billeteras, movimientos y la caja del POS', async () => {
        const { refreshAfterCard } = await import('./treasury-refresh')
        refreshAfterCard(ADJUST_DONE)
        const keys = invalidateQueries.mock.calls.map(([options]) => JSON.stringify(options.queryKey))
        expect(keys).toEqual(
            expect.arrayContaining(['["banks"]', '["wallets"]', '["movements"]', '["pos","cash-summary"]'])
        )
    })

    it('las vistas previas y los pedidos no refrescan nada', async () => {
        const { refreshAfterCard } = await import('./treasury-refresh')
        refreshAfterCard(transferPreview())
        refreshAfterCard(salePreview)
        expect(invalidateQueries).not.toHaveBeenCalled()
    })
})
