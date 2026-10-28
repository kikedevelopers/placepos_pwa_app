import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AssistantCard } from './cards'

const invalidateQueries = vi.fn()
vi.mock('$lib/api/queryClient', () => ({ queryClient: { invalidateQueries } }))

const CREATED: AssistantCard = {
    kind: 'purchase_created',
    purchase_id: 55,
    purchase_number: 'COMP-0055',
    supplier_name: 'DISTRIBUIDORA',
    lines_count: 2,
    total: 1000,
    status: 'PENDING'
}

describe('refreshAfterCard · compras creadas por Place', () => {
    beforeEach(() => {
        invalidateQueries.mockReset()
    })

    it('una compra creada refresca el listado de compras y el dashboard', async () => {
        const { refreshAfterCard } = await import('./treasury-refresh')
        refreshAfterCard(CREATED)
        const keys = invalidateQueries.mock.calls.map(([options]) => JSON.stringify(options.queryKey))
        expect(keys).toEqual(['["purchases"]', '["dashboard"]'])
    })

    it('la vista previa de compra no refresca nada', async () => {
        const { refreshAfterCard, queryKeysAfterCard } = await import('./treasury-refresh')
        const preview: AssistantCard = {
            kind: 'purchase_preview',
            supplier: { name: 'X', document: null },
            invoice_reference: null,
            lines: [],
            excluded: [],
            warnings: [],
            subtotal: 0,
            iva_total: 0,
            total: 0,
            expires_at: '2026-10-29T00:00:00.000Z',
            status: 'pending'
        }
        refreshAfterCard(preview)
        expect(invalidateQueries).not.toHaveBeenCalled()
        expect(queryKeysAfterCard(preview)).toEqual([])
    })
})
