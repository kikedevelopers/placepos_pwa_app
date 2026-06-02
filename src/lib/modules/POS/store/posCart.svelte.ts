import type { PosCustomer } from '$lib/api/requests/pos'
import { roundTo } from '$lib/utils/numbers'

export type CartItem = {
    id: string
    item_id: number
    name: string
    cost: number
    quantity: number
    price: number
    price_mode: 'fixed' | 'manual'
    price_position: number | null
    total: number
    profit: number
    margin: number
    note: string | null
}

export type NewCartItem = Omit<CartItem, 'id' | 'total' | 'profit' | 'margin'>

const lineCalc = (price: number, cost: number, quantity: number) => ({
    total: roundTo(price * quantity, 2),
    profit: roundTo((price - cost) * quantity, 2),
    margin: price > 0 ? roundTo(((price - cost) / price) * 100, 4) : 0
})

const sumTotal = (cart: CartItem[]): number => roundTo(cart.reduce((acc, i) => acc + i.total, 0), 2)

const localId = (): string => `cart-${Date.now()}-${Math.round(Math.random() * 1e6)}`

/**
 * Carrito del POS (equivalente al `usePosCart` de zustand en pos_app). En
 * Svelte 5 se modela con una clase singleton con runes: `cart`, `customer` y
 * `total` son `$state`, por lo que leerlos en un componente es reactivo y
 * mutarlos desde código imperativo (handlers, otros hooks) funciona igual.
 *
 * `total` se mantiene sincronizado tras cada mutación (igual que el `set` de
 * zustand recalculaba `total`), para conservar la misma API que consume el
 * `index.tsx` original (`usePosCart((s) => s.total)`).
 */
class PosCartStore {
    cart = $state<CartItem[]>([])
    customer = $state<PosCustomer | null>(null)
    total = $state(0)

    /** Líneas en el carrito (longitud = contador del botón flotante). */
    get count(): number {
        return this.cart.length
    }

    /**
     * Fusiona solo si coinciden producto, precio Y nota (líneas con notas
     * distintas — p. ej. "con hielo"/"sin hielo" — quedan separadas).
     */
    addToCart(item: NewCartItem): void {
        const existing = this.cart.find(
            (c) =>
                c.item_id === item.item_id &&
                c.price === item.price &&
                (c.note ?? '') === (item.note ?? '')
        )
        if (existing) {
            this.cart = this.cart.map((c) => {
                if (c.id !== existing.id) return c
                const quantity = roundTo(c.quantity + item.quantity, 4)
                return { ...c, quantity, ...lineCalc(c.price, c.cost, quantity) }
            })
        } else {
            this.cart = [
                ...this.cart,
                { ...item, id: localId(), ...lineCalc(item.price, item.cost, item.quantity) }
            ]
        }
        this.total = sumTotal(this.cart)
    }

    /** `quantity <= 0` elimina la línea. */
    updateQuantity(id: string, quantity: number): void {
        if (quantity <= 0) {
            this.cart = this.cart.filter((c) => c.id !== id)
            this.total = sumTotal(this.cart)
            return
        }
        this.cart = this.cart.map((c) =>
            c.id === id ? { ...c, quantity, ...lineCalc(c.price, c.cost, quantity) } : c
        )
        this.total = sumTotal(this.cart)
    }

    updateCartItem(id: string, partial: Partial<NewCartItem>): void {
        this.cart = this.cart.map((c) => {
            if (c.id !== id) return c
            const next = { ...c, ...partial }
            return { ...next, ...lineCalc(next.price, next.cost, next.quantity) }
        })
        this.total = sumTotal(this.cart)
    }

    updateItemNote(id: string, note: string): void {
        this.cart = this.cart.map((c) => (c.id === id ? { ...c, note: note || null } : c))
    }

    removeFromCart(id: string): void {
        this.cart = this.cart.filter((c) => c.id !== id)
        this.total = sumTotal(this.cart)
    }

    clearCart(): void {
        this.cart = []
        this.customer = null
        this.total = 0
    }

    setCustomer(customer: PosCustomer): void {
        this.customer = customer
    }

    clearCustomer(): void {
        this.customer = null
    }
}

export const posCart = new PosCartStore()
