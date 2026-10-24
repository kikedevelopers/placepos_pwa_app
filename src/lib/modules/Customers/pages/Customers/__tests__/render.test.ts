import { describe, expect, it } from 'vitest'
import { render } from 'svelte/server'
import type { Customer } from '$lib/api/requests/customers'
import CustomerRow from '../components/CustomerRow.svelte'

const html = (component: unknown, props: Record<string, unknown>) =>
    render(component as never, { props } as never).body
const isDisabled = (body: string) => /<button[^>]*\sdisabled(="")?[\s>]/.test(body)
const text = (body: string) => body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')

const customer = (over: Partial<Customer> = {}): Customer =>
    ({
        id: 1,
        person_type: 'NATURAL',
        name: 'Alonso Reyes',
        email: null,
        phone: '3001234567',
        doc_number: '1020',
        category: { id: 2, name: 'Redes sociales' },
        balance: 0,
        ...over
    }) as unknown as Customer

describe('CustomerRow', () => {
    it('iniciales, nombre y detalle (categoría · documento · teléfono)', () => {
        const t = text(html(CustomerRow, { customer: customer() }))
        expect(t).toContain('AR')
        expect(t).toContain('Alonso Reyes')
        expect(t).toContain('Redes sociales · 1020 · 3001234567')
    })

    it('empresa con icono; sin datos dice "Sin documento"', () => {
        const body = html(CustomerRow, { customer: customer({ person_type: 'COMPANY', category: null, doc_number: null, phone: null } as Partial<Customer>) })
        expect(body).toContain('lucide-building-2')
        expect(text(body)).toContain('Sin documento')
    })

    it('no muestra el campo balance (no refleja la deuda real)', () => {
        expect(text(html(CustomerRow, { customer: customer({ balance: 5000 }) }))).not.toContain('Debe')
    })

    it('sin permiso de edición no es pulsable', () => {
        expect(isDisabled(html(CustomerRow, { customer: customer() }))).toBe(true)
        expect(isDisabled(html(CustomerRow, { customer: customer(), onclick: () => {} }))).toBe(false)
    })
})
