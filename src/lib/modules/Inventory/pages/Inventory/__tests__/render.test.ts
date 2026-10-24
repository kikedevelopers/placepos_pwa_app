import { describe, expect, it, vi } from 'vitest'
import { render } from 'svelte/server'
import type { Product } from '$lib/api/requests/products'
import ProductRow from '../components/ProductRow.svelte'

// ProductImage lee la base del API del entorno de SvelteKit.
vi.mock('$lib/constants/env', () => ({ env: { apiBaseUrl: 'http://api.test' } }))

const html = (component: unknown, props: Record<string, unknown>) =>
    render(component as never, { props } as never).body
const isDisabled = (body: string) => /<button[^>]*\sdisabled(="")?[\s>]/.test(body)
const text = (body: string) => body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')

const product = (over: Partial<Product> = {}): Product =>
    ({
        id: 1,
        name: 'FINAS HIERBAS X LIBRA',
        sku_code: 'FH-1',
        cost: 11000,
        stock_display: 20,
        parent_id: null,
        packaging: { id: 1, name: 'LIBRA', value: 1 },
        prices: [{ sale_price: 12500 }],
        image_url: null,
        ...over
    }) as unknown as Product

describe('ProductRow', () => {
    it('nombre, SKU, costo, precio y existencias con su unidad', () => {
        const t = text(html(ProductRow, { product: product(), first: true, last: false }))
        expect(t).toContain('FINAS HIERBAS X LIBRA')
        expect(t).toContain('FH-1')
        expect(t).toMatch(/Costo \$\s?11\.000/)
        expect(t).toContain('12.500')
        expect(t).toContain('20 LIBRA')
    })

    it('redondea solo la primera arriba y la última abajo (lista virtual agrupada)', () => {
        expect(html(ProductRow, { product: product(), first: true, last: false })).toContain('rounded-t-[22px]')
        const last = html(ProductRow, { product: product(), first: false, last: true })
        expect(last).toContain('rounded-b-[22px]')
        expect(last).not.toContain('rounded-t-[22px]')
        // Las filas siguientes llevan la línea separadora.
        expect(last).toContain('before:h-px')
    })

    it('existencias negativas o en cero en rojo; bajas en ámbar', () => {
        expect(html(ProductRow, { product: product({ stock_display: -3 }), first: true, last: true })).toContain('text-destructive')
        expect(html(ProductRow, { product: product({ stock_display: 0 }), first: true, last: true })).toContain('text-destructive')
        expect(html(ProductRow, { product: product({ stock_display: 4 }), first: true, last: true })).toContain('text-warning')
    })

    it('presentación rotulada; sin precio lo dice; sin permiso no es pulsable', () => {
        const t = text(html(ProductRow, { product: product({ parent_id: 9, prices: [] }), first: true, last: true }))
        expect(t).toContain('Presentación')
        expect(t).toContain('Sin precio')
        expect(isDisabled(html(ProductRow, { product: product(), first: true, last: true }))).toBe(true)
        expect(isDisabled(html(ProductRow, { product: product(), first: true, last: true, onclick: () => {} }))).toBe(false)
    })
})
