import { describe, expect, it } from 'vitest'
import type { AgentOrderTicket } from '$lib/api/requests/agentOrders/types'
import { orderActions, statusPillLabel, statusTrail, ticketKindLabel } from './orderActions'

const ticket = (patch: Partial<AgentOrderTicket> = {}): AgentOrderTicket => ({
    id: 9,
    type: 'ORDER',
    number: 'PED-12',
    is_credit: false,
    is_voided: false,
    ...patch
})

describe('ticketKindLabel', () => {
    it('pedido, venta, crédito, préstamo y anulado', () => {
        expect(ticketKindLabel(ticket())).toBe('Pedido')
        expect(ticketKindLabel(ticket({ type: 'SALE' }))).toBe('Venta')
        expect(ticketKindLabel(ticket({ type: 'SALE', is_credit: true }))).toBe('Crédito')
        expect(ticketKindLabel(ticket({ type: 'LOAN' }))).toBe('Préstamo')
        expect(ticketKindLabel(ticket({ type: 'SALE', is_voided: true }))).toBe('Anulado')
    })
})

describe('orderActions', () => {
    it('por tomar y el usuario vende: llevar al POS, tomar o descartar', () => {
        expect(orderActions({ status: 'pending', ticket: null }, true)).toEqual({
            primary: 'pos',
            canMarkTaken: true,
            canDismiss: true,
            canReturnPending: false,
            returnBlockedReason: null
        })
    })

    it('por tomar sin acceso al POS: sin acción principal, pero se puede tomar', () => {
        const actions = orderActions({ status: 'pending', ticket: null }, false)
        expect(actions.primary).toBeNull()
        expect(actions.canMarkTaken).toBe(true)
    })

    it('en un ticket vivo: verlo; no se devuelve a por tomar', () => {
        const actions = orderActions({ status: 'taken', ticket: ticket() }, true)
        expect(actions.primary).toBe('ticket')
        expect(actions.canReturnPending).toBe(false)
        expect(actions.returnBlockedReason).toBe('Está en PED-12: anúlalo para devolverlo')
    })

    it('ticket anulado: se puede devolver a por tomar', () => {
        const actions = orderActions({ status: 'taken', ticket: ticket({ is_voided: true }) }, true)
        expect(actions.primary).toBeNull()
        expect(actions.canReturnPending).toBe(true)
        expect(actions.returnBlockedReason).toBeNull()
    })

    it('descartado sin ticket: se puede devolver; no se toma ni descarta', () => {
        const actions = orderActions({ status: 'dismissed', ticket: null }, true)
        expect(actions).toMatchObject({ canReturnPending: true, canMarkTaken: false, canDismiss: false })
    })
})

describe('statusTrail / statusPillLabel', () => {
    it('quién y qué', () => {
        expect(
            statusTrail({ status: 'taken', cancelled_by_customer: false, status_changed_by: 'Ana' })
        ).toBe('Tomado por Ana')
        expect(
            statusTrail({ status: 'dismissed', cancelled_by_customer: true, status_changed_by: null })
        ).toBe('Cancelado por el cliente')
        expect(
            statusTrail({ status: 'dismissed', cancelled_by_customer: false, status_changed_by: null })
        ).toBe('Descartado')
    })

    it('la pastilla distingue el descarte del cliente', () => {
        expect(statusPillLabel({ status: 'pending' })).toBe('Por tomar')
        expect(statusPillLabel({ status: 'taken' })).toBe('Tomado')
        expect(statusPillLabel({ status: 'dismissed', cancelled_by_customer: true })).toBe(
            'Cancelado por el cliente'
        )
        expect(statusPillLabel({ status: 'dismissed' })).toBe('Descartado')
    })
})
