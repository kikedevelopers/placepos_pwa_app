import { describe, expect, it } from 'vitest'
import type { Product } from '$lib/api/requests/products'
import { LOW_STOCK_THRESHOLD, countByFilter, filterInventory, stockState } from './inventoryList'

const product = (p: Partial<Product> & { id: number }): Product => ({
    id: p.id,
    name: p.name ?? `Producto ${p.id}`,
    bar_code: p.bar_code ?? null,
    sku_code: p.sku_code ?? null,
    description: null,
    cost: 0,
    stock: p.stock_display ?? 0,
    stock_display: p.stock_display ?? 0,
    product_type: 'SIMPLE',
    parent_id: p.parent_id ?? null,
    packaging_id: null,
    category_id: null,
    show_in_pos: true,
    is_purchasable: true,
    is_archived: false,
    archived: false,
    created_at: '2026-01-01T00:00:00.000Z',
    packaging: null,
    category: null,
    prices: []
})

const LIST = [
    product({ id: 1, name: 'Canela en polvo', sku_code: 'CAN-01', stock_display: 20 }),
    product({ id: 2, name: 'Canela x 500 g', parent_id: 1, stock_display: 40 }),
    product({ id: 3, name: 'Té verde', bar_code: '7701234', stock_display: 0 }),
    product({ id: 4, name: 'Jamaica', stock_display: -3 })
]

describe('filterInventory', () => {
    it('sin búsqueda ni filtro devuelve todo', () => {
        expect(filterInventory(LIST, '', 'all')).toHaveLength(4)
    })

    it('busca por nombre (sin mayúsculas), SKU y código de barras', () => {
        expect(filterInventory(LIST, 'CANELA', 'all').map((p) => p.id)).toEqual([1, 2])
        expect(filterInventory(LIST, 'can-01', 'all').map((p) => p.id)).toEqual([1])
        expect(filterInventory(LIST, '770123', 'all').map((p) => p.id)).toEqual([3])
        expect(filterInventory(LIST, '  té  ', 'all').map((p) => p.id)).toEqual([3])
    })

    it('filtra bases, presentaciones y agotados (incluye negativos)', () => {
        expect(filterInventory(LIST, '', 'base').map((p) => p.id)).toEqual([1, 3, 4])
        expect(filterInventory(LIST, '', 'presentation').map((p) => p.id)).toEqual([2])
        expect(filterInventory(LIST, '', 'out').map((p) => p.id)).toEqual([3, 4])
    })

    it('combina búsqueda y filtro', () => {
        expect(filterInventory(LIST, 'canela', 'presentation').map((p) => p.id)).toEqual([2])
        expect(filterInventory(LIST, 'zzz', 'all')).toEqual([])
    })
})

describe('countByFilter', () => {
    it('cuenta cada grupo', () => {
        expect(countByFilter(LIST)).toEqual({ all: 4, base: 3, presentation: 1, out: 2 })
        expect(countByFilter([])).toEqual({ all: 0, base: 0, presentation: 0, out: 0 })
    })
})

describe('stockState', () => {
    it('negativo, agotado, bajo y disponible', () => {
        expect(stockState(-3)).toEqual({ label: 'Negativo', tone: 'negative' })
        expect(stockState(0)).toEqual({ label: 'Agotado', tone: 'negative' })
        expect(stockState(LOW_STOCK_THRESHOLD - 1).tone).toBe('warning')
        expect(stockState(LOW_STOCK_THRESHOLD).tone).toBe('neutral')
    })
})
