import { describe, expect, it } from 'vitest'
import { relatedCandidates } from './assistantProfileLogic'

const products = [
    { id: 1, name: 'Café molido libra', parent_id: null },
    { id: 2, name: 'Café molido media libra', parent_id: 1 },
    { id: 3, name: 'Filtro de café', parent_id: null },
    { id: 4, name: 'Café viejo', parent_id: null, archived: true },
    { id: 5, name: 'Azúcar', parent_id: null }
]

describe('relatedCandidates', () => {
    it('busca sin tildes ni mayúsculas y marca las presentaciones', () => {
        expect(relatedCandidates(products, 'CAFE', 99, [])).toEqual([
            { id: 1, name: 'Café molido libra', isPresentation: false },
            { id: 2, name: 'Café molido media libra', isPresentation: true },
            { id: 3, name: 'Filtro de café', isPresentation: false }
        ])
    })

    it('excluye el producto de la ficha, los archivados y los ya relacionados', () => {
        const found = relatedCandidates(products, 'cafe', 1, [{ product_id: 3, kind: 'complement', name: 'Filtro' }])
        expect(found.map((p) => p.id)).toEqual([2])
    })

    it('sin texto no sugiere nada; respeta el máximo', () => {
        expect(relatedCandidates(products, '  ', 99, [])).toEqual([])
        expect(relatedCandidates(products, 'a', 99, [], 2)).toHaveLength(2)
    })
})
