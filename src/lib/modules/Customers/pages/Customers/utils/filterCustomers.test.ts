import { describe, it, expect } from 'vitest'
import type { Customer } from '$lib/api/requests/customers'
import { filterCustomers } from './filterCustomers'

const make = (over: Partial<Customer>): Customer => ({
    id: 1,
    person_type: 'INDIVIDUAL',
    name: 'Juan',
    email: null,
    phone: null,
    doc_number: null,
    address: null,
    category_id: null,
    category: null,
    balance: 0,
    is_archived: false,
    created_by: null,
    created_at: '2026-09-25',
    ...over
})

const list: Customer[] = [
    make({ id: 1, name: 'Juan Pérez', doc_number: '123', category_id: 3 }),
    make({ id: 2, name: 'María López', email: 'maria@test.com', category_id: 5 }),
    make({ id: 3, name: 'Pedro', category_id: null })
]

describe('filterCustomers', () => {
    it('sin búsqueda ni categoría devuelve todo', () => {
        expect(filterCustomers(list, '', null)).toHaveLength(3)
    })

    it('filtra por nombre (case-insensitive)', () => {
        const result = filterCustomers(list, 'maria', null)
        expect(result.map((c) => c.id)).toEqual([2])
    })

    it('filtra por documento', () => {
        expect(filterCustomers(list, '123', null).map((c) => c.id)).toEqual([1])
    })

    it('filtra por correo', () => {
        expect(filterCustomers(list, 'maria@test', null).map((c) => c.id)).toEqual([2])
    })

    it('filtra por categoría', () => {
        expect(filterCustomers(list, '', 3).map((c) => c.id)).toEqual([1])
        expect(filterCustomers(list, '', 5).map((c) => c.id)).toEqual([2])
    })

    it('combina búsqueda y categoría', () => {
        // "Juan" existe pero con categoría 3; filtrar por categoría 5 lo excluye.
        expect(filterCustomers(list, 'juan', 5)).toHaveLength(0)
        expect(filterCustomers(list, 'juan', 3).map((c) => c.id)).toEqual([1])
    })

    it('categoría null no filtra por categoría (incluye clientes sin categoría)', () => {
        expect(filterCustomers(list, '', null).map((c) => c.id)).toContain(3)
    })
})
