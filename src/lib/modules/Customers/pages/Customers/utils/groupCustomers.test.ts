import { describe, expect, it } from 'vitest'
import { groupByInitial, indexLetter } from './groupCustomers'

describe('indexLetter', () => {
    it('letra mayúscula sin tilde; Ñ propia; resto a #', () => {
        expect(indexLetter('ana')).toBe('A')
        expect(indexLetter('Ángela')).toBe('A')
        expect(indexLetter('ñandú')).toBe('Ñ')
        expect(indexLetter('  pedro')).toBe('P')
        expect(indexLetter('3M Colombia')).toBe('#')
        expect(indexLetter('')).toBe('#')
    })
})

describe('groupByInitial', () => {
    const names = ['pedro', 'Ángela', 'ana', 'Ñoño', 'Nubia', '7 Hermanos', 'Bruno']

    it('ordena en español y agrupa por letra, con # al final', () => {
        const groups = groupByInitial(names, (n) => n)
        expect(groups.map((g) => g.letter)).toEqual(['A', 'B', 'N', 'Ñ', 'P', '#'])
        expect(groups[0].items).toEqual(['ana', 'Ángela'])
        expect(groups[groups.length - 1].items).toEqual(['7 Hermanos'])
    })

    it('no muta la lista original y tolera vacía', () => {
        const copy = [...names]
        groupByInitial(names, (n) => n)
        expect(names).toEqual(copy)
        expect(groupByInitial([], (n: string) => n)).toEqual([])
    })
})
