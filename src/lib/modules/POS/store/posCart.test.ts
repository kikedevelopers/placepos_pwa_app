import { beforeEach, describe, expect, it } from 'vitest'
import { posCart, type NewCartItem } from './posCart.svelte'

const baseItem = (over: Partial<NewCartItem> = {}): NewCartItem => ({
    item_id: 1,
    name: 'PRODUCTO',
    cost: 50,
    quantity: 2,
    price: 5200,
    price_mode: 'fixed',
    price_position: 0,
    note: null,
    ...over
})

describe('posCart · totales de línea', () => {
    beforeEach(() => posCart.clearCart())

    it('sin total pinado: deriva total = precio × cantidad', () => {
        posCart.addToCart(baseItem({ quantity: 2, price: 5200, cost: 4400 }))
        const line = posCart.cart[0]
        expect(line.total).toBe(10400)
        expect(line.profit).toBe(1600)
        expect(line.margin).toBe(15.3846)
        expect(posCart.total).toBe(10400)
    })

    it('con total pinado (cálculo por monto): conserva 2.000 exactos, no 1.999,95', () => {
        posCart.addToCart(
            baseItem({
                item_id: 7,
                cost: 1000,
                quantity: 1.3333,
                price: 1500,
                price_mode: 'manual',
                price_position: null,
                total: 2000,
                profit: 666.5,
                margin: 33.3333
            })
        )
        const line = posCart.cart[0]
        expect(line.total).toBe(2000)
        expect(line.profit).toBe(666.5)
        expect(line.margin).toBe(33.3333)
        expect(posCart.total).toBe(2000)
    })

    it('merge (mismo producto+precio+nota) suma cantidad y recalcula el total', () => {
        posCart.addToCart(baseItem({ quantity: 2, price: 5200, cost: 4400 }))
        posCart.addToCart(baseItem({ quantity: 3, price: 5200, cost: 4400 }))
        expect(posCart.cart).toHaveLength(1)
        expect(posCart.cart[0].quantity).toBe(5)
        expect(posCart.cart[0].total).toBe(26000)
        expect(posCart.total).toBe(26000)
    })

    it('notas distintas NO se fusionan (líneas separadas)', () => {
        posCart.addToCart(baseItem({ note: 'con hielo' }))
        posCart.addToCart(baseItem({ note: 'sin hielo' }))
        expect(posCart.cart).toHaveLength(2)
    })
})
