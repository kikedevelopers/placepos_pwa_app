import { describe, it, expect } from 'vitest'
import type { Product } from '$lib/api/requests/products'
import { computeInventoryStats } from './inventoryStats'

function makeProduct(p: Partial<Product> & { id: number }): Product {
    return {
        id: p.id,
        name: p.name ?? `Producto ${p.id}`,
        bar_code: null,
        sku_code: null,
        description: null,
        cost: p.cost ?? 0,
        stock: p.stock ?? 0,
        stock_display: p.stock_display ?? 0,
        product_type: 'SIMPLE',
        parent_id: p.parent_id ?? null,
        packaging_id: null,
        category_id: null,
        show_in_pos: true,
        is_purchasable: false,
        is_archived: false,
        archived: false,
        created_at: '2026-01-01T00:00:00.000Z',
        packaging: p.packaging ?? null,
        category: null,
        prices: p.prices ?? []
    }
}

describe('computeInventoryStats (PWA) — paridad con placepos', () => {
    it('valora un base con empaque por stock_display, no por stock crudo', () => {
        const products = [
            makeProduct({
                id: 1,
                name: 'MIELTERTOS X 25 UN',
                cost: 44000,
                stock: 25,
                stock_display: 1,
                packaging: { id: 1, name: '25 UNIDADES', value: 25 }
            })
        ]
        expect(computeInventoryStats(products).valuation).toBe(44000)
    })

    it('escala con la cantidad de empaques (2 cajas = 88.000)', () => {
        const products = [
            makeProduct({ id: 1, cost: 44000, stock: 50, stock_display: 2 })
        ]
        expect(computeInventoryStats(products).valuation).toBe(88000)
    })

    it('NO cuenta presentaciones (ni en valor ni en el conteo)', () => {
        const products = [
            makeProduct({
                id: 1,
                name: 'MIELTERTOS X 25 UN',
                cost: 44000,
                stock: 25,
                stock_display: 1,
                packaging: { id: 1, name: '25 UNIDADES', value: 25 }
            }),
            makeProduct({
                id: 2,
                name: 'MIELTERTOS SOBRE',
                parent_id: 1,
                cost: 1760,
                stock: 25,
                stock_display: 25
            })
        ]
        const stats = computeInventoryStats(products)
        expect(stats.valuation).toBe(44000)
        expect(stats.count).toBe(1)
    })

    it('base sin empaque: stock_display == stock', () => {
        const products = [makeProduct({ id: 1, cost: 11600, stock: 13, stock_display: 13 })]
        expect(computeInventoryStats(products).valuation).toBe(150800)
    })

    it('cuenta bases sin existencias en outOfStock', () => {
        const products = [
            makeProduct({ id: 1, cost: 100, stock_display: 2 }),
            makeProduct({ id: 2, cost: 50, stock_display: 0 }),
            makeProduct({ id: 3, cost: 200, stock_display: -1 }),
            // presentación sin stock: NO debe contar en outOfStock
            makeProduct({ id: 4, parent_id: 1, stock_display: 0 })
        ]
        const stats = computeInventoryStats(products)
        expect(stats.outOfStock).toBe(2)
        expect(stats.count).toBe(3)
        expect(stats.valuation).toBe(200)
    })

    it('inventario vacío da todo en cero', () => {
        expect(computeInventoryStats([])).toEqual({ count: 0, valuation: 0, outOfStock: 0 })
    })
})
