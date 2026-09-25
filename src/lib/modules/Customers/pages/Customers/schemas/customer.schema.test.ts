import { describe, it, expect } from 'vitest'
import { customerSchema } from './customer.schema'

const base = {
    person_type: 'INDIVIDUAL' as const,
    name: 'Juan',
    doc_number: '',
    phone: '',
    email: '',
    address: ''
}

describe('customerSchema — category_id', () => {
    it('acepta category_id numérico positivo', () => {
        expect(customerSchema.safeParse({ ...base, category_id: 3 }).success).toBe(true)
    })

    it('acepta category_id null', () => {
        expect(customerSchema.safeParse({ ...base, category_id: null }).success).toBe(true)
    })

    it('rechaza category_id ausente (el campo es requerido en el form, default null)', () => {
        // El schema no marca category_id opcional: el form siempre lo inicializa
        // (null). Un objeto sin la clave falla — garantiza que el form la envíe.
        expect(customerSchema.safeParse(base).success).toBe(false)
    })

    it('rechaza category_id no positivo o no entero', () => {
        expect(customerSchema.safeParse({ ...base, category_id: 0 }).success).toBe(false)
        expect(customerSchema.safeParse({ ...base, category_id: -2 }).success).toBe(false)
        expect(customerSchema.safeParse({ ...base, category_id: 1.5 }).success).toBe(false)
    })
})
