import { describe, expect, it, vi } from 'vitest'
import type { AgentOrderItem } from '$lib/api/requests/agentOrders/types'
import type { PosProduct } from '$lib/api/requests/pos'

vi.mock('../store/posCart.svelte', () => ({}))
const { agentOrderLoadWarnings, buildCartFromAgentOrder } = await import('./agentOrderCart')

const product = (id: number, name: string, cost: number, prices: number[]): PosProduct =>
    ({
        id,
        name,
        cost,
        bar_code: '',
        sku_code: '',
        packaging_id: null,
        packaging: null,
        prices: prices.map((sale_price, i) => ({ id: i + 1, sale_price, profit: 0, margin: 0 })),
        parent: null,
        stock: 10,
        image: null,
        image_url: null
    }) as PosProduct

const item = (product_id: number, name: string, quantity: string, unit_price: string): AgentOrderItem => ({
    product_id,
    name,
    quantity,
    unit_price,
    total: String(Number(quantity) * Number(unit_price))
})

const PRODUCTS = [
    product(45924, 'MANI TOSTADO LIBRA CON SAL', 6000, [8600, 8000]),
    product(47046, 'MANI TOSTADO 1/2 LIBRA CON SAL', 3000, [4300])
]

describe('buildCartFromAgentOrder', () => {
    it('cantidad y precio cotizados; el precio de lista queda fijo en su posición', () => {
        const result = buildCartFromAgentOrder(
            [item(45924, 'Maní libra', '25.0000', '8000.00'), item(47046, 'Maní media', '1.0000', '4300.00')],
            PRODUCTS
        )
        expect(result.items).toEqual([
            {
                item_id: 45924,
                name: 'MANI TOSTADO LIBRA CON SAL',
                cost: 6000,
                quantity: 25,
                price: 8000,
                price_mode: 'fixed',
                price_position: 1,
                note: null
            },
            expect.objectContaining({ item_id: 47046, quantity: 1, price: 4300, price_position: 0 })
        ])
        expect(result.missing).toEqual([])
        expect(result.repriced).toEqual([])
    })

    it('si la lista cambió, respeta lo cotizado como precio manual y lo reporta', () => {
        const result = buildCartFromAgentOrder([item(45924, 'Maní libra', '1.0000', '8200.00')], PRODUCTS)
        expect(result.items[0]).toMatchObject({ price: 8200, price_mode: 'manual', price_position: null })
        expect(result.repriced).toEqual(['MANI TOSTADO LIBRA CON SAL'])
    })

    it('lo que ya no está en el POS (o viene raro) no se carga y se reporta', () => {
        const result = buildCartFromAgentOrder(
            [
                item(999, 'Producto archivado', '1.0000', '1000.00'),
                item(45924, 'Cantidad rara', 'x', '8600.00'),
                item(45924, 'Cantidad cero', '0.0000', '8600.00')
            ],
            PRODUCTS
        )
        expect(result.items).toEqual([])
        expect(result.missing).toEqual(['Producto archivado', 'Cantidad rara', 'Cantidad cero'])
    })
})

describe('agentOrderLoadWarnings', () => {
    it('un aviso por cada problema; nada si todo cuadró', () => {
        expect(agentOrderLoadWarnings({ missing: [], repriced: [] })).toEqual([])
        expect(agentOrderLoadWarnings({ missing: ['A', 'B'], repriced: ['C'] })).toEqual([
            'No se cargaron (ya no están en el POS): A, B.',
            'Con el precio que se le cotizó al cliente (la lista cambió): C.'
        ])
    })
})
