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

describe('posCart · mismo producto a otro precio actualiza la línea', () => {
    beforeEach(() => posCart.clearCart())

    it('NO duplica: suma la cantidad y toma el precio nuevo (2 a 4.000 + 10 a 6.000 → 12 a 6.000)', () => {
        posCart.addToCart(baseItem({ quantity: 2, price: 4000, cost: 3000 }))
        posCart.addToCart(baseItem({ quantity: 10, price: 6000, cost: 3000, price_position: 1 }))
        expect(posCart.cart).toHaveLength(1)
        expect(posCart.cart[0]).toMatchObject({
            quantity: 12,
            price: 6000,
            price_position: 1,
            total: 72000,
            profit: 36000,
            margin: 50
        })
        expect(posCart.total).toBe(72000)
    })

    it('conserva id y nota de la línea existente', () => {
        posCart.addToCart(baseItem({ price: 4000, note: 'sin hielo' }))
        const { id } = posCart.cart[0]
        posCart.addToCart(baseItem({ price: 6000, note: 'sin hielo' }))
        expect(posCart.cart).toHaveLength(1)
        expect(posCart.cart[0]).toMatchObject({ id, note: 'sin hielo', price: 6000 })
    })

    it('precio manual: la línea pasa a modo manual sin posición', () => {
        posCart.addToCart(baseItem({ quantity: 1, price: 4000 }))
        posCart.addToCart(
            baseItem({ quantity: 1, price: 4500, price_mode: 'manual', price_position: null })
        )
        expect(posCart.cart).toHaveLength(1)
        expect(posCart.cart[0]).toMatchObject({
            quantity: 2,
            price: 4500,
            price_mode: 'manual',
            price_position: null,
            total: 9000
        })
    })

    it('volver a un precio de lista desde uno manual regresa a modo fijo', () => {
        posCart.addToCart(
            baseItem({ quantity: 1, price: 4500, price_mode: 'manual', price_position: null })
        )
        posCart.addToCart(baseItem({ quantity: 1, price: 4000, price_position: 0 }))
        expect(posCart.cart[0]).toMatchObject({
            price: 4000,
            price_mode: 'fixed',
            price_position: 0,
            total: 8000
        })
    })

    it('otro producto no se ve afectado', () => {
        posCart.addToCart(baseItem({ item_id: 1, quantity: 1, price: 4000 }))
        posCart.addToCart(baseItem({ item_id: 2, quantity: 1, price: 900 }))
        posCart.addToCart(baseItem({ item_id: 1, quantity: 1, price: 6000 }))
        expect(posCart.cart).toHaveLength(2)
        expect(posCart.cart[1]).toMatchObject({ item_id: 2, quantity: 1, price: 900, total: 900 })
        expect(posCart.total).toBe(12000 + 900)
    })

    it('con nota distinta y otro precio sigue abriendo línea aparte', () => {
        posCart.addToCart(baseItem({ price: 4000, note: 'con hielo' }))
        posCart.addToCart(baseItem({ price: 6000, note: 'sin hielo' }))
        expect(posCart.cart).toHaveLength(2)
        expect(posCart.cart[0].price).toBe(4000)
    })
})

describe('posCart · pedido del agente ("Llevar al POS")', () => {
    beforeEach(() => {
        posCart.clearCart()
    })

    const order = { id: 7, reference: 'P-1', customer_label: 'Ana', phone: '573001234567' }

    it('el carrito pasa a ser el pedido: reemplaza lo anterior y calcula los totales', () => {
        posCart.addToCart(baseItem({ item_id: 99 }))
        posCart.setCustomer({ id: 3, name: 'Otro' })
        posCart.loadAgentOrder(order, [
            baseItem({ item_id: 1, quantity: 25, price: 8000, cost: 6000 }),
            baseItem({ item_id: 2, quantity: 1, price: 4300, cost: 3000 })
        ])
        expect(posCart.cart.map((c) => c.item_id)).toEqual([1, 2])
        expect(posCart.cart[0].total).toBe(200000)
        expect(posCart.total).toBe(204300)
        expect(posCart.customer).toBeNull()
        expect(posCart.agentOrder).toEqual(order)
    })

    it('vaciar el carrito suelta el pedido del agente', () => {
        posCart.loadAgentOrder(order, [baseItem()])
        posCart.clearCart()
        expect(posCart.agentOrder).toBeNull()
        expect(posCart.cart).toEqual([])
    })
})
