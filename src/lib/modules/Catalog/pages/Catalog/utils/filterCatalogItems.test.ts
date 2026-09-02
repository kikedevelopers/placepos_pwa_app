import { describe, it, expect } from 'vitest'
import type { PosProduct } from '$lib/api/requests/pos'
import { filterCatalogItems } from './filterCatalogItems'

function makeItem(p: Partial<PosProduct> & { id: number; name: string }): PosProduct {
    return {
        id: p.id,
        name: p.name,
        cost: p.cost ?? 0,
        bar_code: p.bar_code ?? '',
        sku_code: p.sku_code ?? '',
        packaging_id: null,
        packaging: null,
        prices: p.prices ?? [{ id: 1, sale_price: 1000, profit: 0, margin: 0 }],
        parent: null,
        stock: p.stock ?? 10,
        image: p.image ?? null,
        image_url: p.image_url ?? null,
        description: p.description ?? null
    }
}

describe('filterCatalogItems', () => {
    const items = [
        makeItem({ id: 1, name: 'Zapato deportivo', sku_code: 'ZAP-001' }),
        makeItem({ id: 2, name: 'Arroz x libra', bar_code: '7701234567890' }),
        makeItem({ id: 3, name: 'Café molido' })
    ]

    it('sin término de búsqueda: devuelve todo ordenado alfabéticamente', () => {
        expect(filterCatalogItems(items, '').map((i) => i.name)).toEqual([
            'Arroz x libra',
            'Café molido',
            'Zapato deportivo'
        ])
    })

    it('filtra por nombre, sin distinguir mayúsculas/minúsculas', () => {
        expect(filterCatalogItems(items, 'ZAPATO').map((i) => i.id)).toEqual([1])
    })

    it('filtra por SKU', () => {
        expect(filterCatalogItems(items, 'zap-001').map((i) => i.id)).toEqual([1])
    })

    it('filtra por código de barras', () => {
        expect(filterCatalogItems(items, '7701234567890').map((i) => i.id)).toEqual([2])
    })

    it('sin coincidencias: devuelve un arreglo vacío', () => {
        expect(filterCatalogItems(items, 'inexistente')).toEqual([])
    })

    it('espacios en blanco alrededor del término no afectan el resultado', () => {
        expect(filterCatalogItems(items, '  café  ').map((i) => i.id)).toEqual([3])
    })

    it('lista vacía: no revienta y devuelve vacío', () => {
        expect(filterCatalogItems([], 'algo')).toEqual([])
    })

    it('no muta el arreglo original', () => {
        const original = [...items]
        filterCatalogItems(items, '')
        expect(items).toEqual(original)
    })
})
