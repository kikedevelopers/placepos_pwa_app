import { describe, expect, it } from 'vitest'
import {
    agentOrderEventOf,
    agentSystemNotification,
    arrivedOrderReference,
    createEventDeduper,
    isOtherBranchEvent,
    otherBranchSystemNotification
} from './agentEvents'

describe('arrivedOrderReference', () => {
    it('llegada: devuelve la referencia', () => {
        expect(arrivedOrderReference({ reason: 'created', reference: ' P-1 ' })).toBe('P-1')
    })

    it('llegada sin referencia: cadena vacía (igual se avisa)', () => {
        expect(arrivedOrderReference({ reason: 'created' })).toBe('')
    })

    it('cambio de estado o payload raro: null (no se avisa)', () => {
        expect(arrivedOrderReference({ reason: 'status_changed', reference: 'P-1' })).toBeNull()
        expect(arrivedOrderReference(null)).toBeNull()
        expect(arrivedOrderReference('created')).toBeNull()
    })
})

describe('agentOrderEventOf', () => {
    it('pedido nuevo, actualizado por el cliente y solicitud sobre uno tomado', () => {
        expect(agentOrderEventOf({ reason: 'created', reference: 'P-1' })).toEqual({
            kind: 'created',
            reference: 'P-1'
        })
        expect(agentOrderEventOf({ reason: 'updated', reference: 'P-1' })).toEqual({
            kind: 'updated',
            reference: 'P-1'
        })
        expect(agentOrderEventOf({ reason: 'customer_request', reference: 'P-1' })).toEqual({
            kind: 'request',
            reference: 'P-1'
        })
    })

    it('cambios de estado del negocio o payloads raros: sin aviso', () => {
        expect(agentOrderEventOf({ reason: 'status_changed', reference: 'P-1' })).toBeNull()
        expect(agentOrderEventOf(null)).toBeNull()
        expect(agentOrderEventOf({ reason: 7 })).toBeNull()
        expect(agentOrderEventOf({ reason: 'updated' })).toEqual({ kind: 'updated', reference: '' })
    })
})

describe('agentOrderEventOf · cancelación e id', () => {
    it('cancelado por el cliente y el id del pedido', () => {
        expect(agentOrderEventOf({ reason: 'cancelled', reference: 'P-1', order_id: 4 })).toEqual({
            kind: 'cancelled',
            reference: 'P-1',
            order_id: 4
        })
        expect(agentOrderEventOf({ reason: 'created', reference: 'P-1', order_id: 'x' })).toEqual({
            kind: 'created',
            reference: 'P-1'
        })
    })
})

describe('agentSystemNotification', () => {
    const order = {
        customer_name: 'Enrique',
        chat_display_name: null,
        total: 48000,
        items_count: 2
    }

    it('pedido nuevo: quién, cuánto, productos y referencia; abre ese pedido', () => {
        const n = agentSystemNotification(
            { kind: 'created', reference: 'P-854A38BE', order_id: 4 },
            order
        )
        expect(n.title).toBe('Nuevo pedido del agente')
        expect(n.body).toMatch(/^Enrique · \$\s?48\.000 · 2 productos · P-854A38BE$/)
        expect(n.route).toBe('/reportes?tab=agente&order=4')
    })

    it('cada evento tiene su título', () => {
        expect(agentSystemNotification({ kind: 'updated', reference: 'P-1' }, order).title).toBe(
            'Pedido actualizado por el cliente'
        )
        expect(agentSystemNotification({ kind: 'cancelled', reference: 'P-1' }, order).title).toBe(
            'El cliente canceló su pedido'
        )
        expect(agentSystemNotification({ kind: 'request', reference: 'P-1' }, order).title).toBe(
            'El cliente pide un cambio'
        )
    })

    it('sin el pedido: la referencia; sin id: el informe', () => {
        expect(agentSystemNotification({ kind: 'created', reference: 'P-1' }, null)).toEqual({
            title: 'Nuevo pedido del agente',
            body: 'Pedido P-1',
            route: '/reportes?tab=agente'
        })
        expect(
            agentSystemNotification(
                { kind: 'created', reference: '' },
                { ...order, customer_name: null, items_count: 1 }
            ).body
        ).toMatch(/^Un cliente · .* · 1 producto$/)
    })
})

describe('pedidos de otra sucursal (dueño)', () => {
    const payload = {
        reason: 'created',
        reference: 'P-1',
        order_id: 4,
        company_id: 20,
        company_name: 'Esencia & Grano - la 28',
        customer_name: 'Marta',
        total: 26500,
        items_count: 1
    }

    it('el evento trae la sucursal y los datos para avisar', () => {
        expect(agentOrderEventOf(payload)).toEqual({
            kind: 'created',
            reference: 'P-1',
            order_id: 4,
            company_id: 20,
            company_name: 'Esencia & Grano - la 28',
            customer_name: 'Marta',
            total: 26500,
            items_count: 1
        })
    })

    it('isOtherBranchEvent: solo si es de otro negocio', () => {
        const event = agentOrderEventOf(payload)!
        expect(isOtherBranchEvent(event, 13)).toBe(true)
        expect(isOtherBranchEvent(event, 20)).toBe(false)
        expect(isOtherBranchEvent({ kind: 'created', reference: 'P-1' }, 13)).toBe(false)
    })

    it('la notificación del sistema lleva el nombre de la sucursal y abre el centro', () => {
        const n = otherBranchSystemNotification(agentOrderEventOf(payload)!)
        expect(n.title).toBe('Nuevo pedido del agente · Esencia & Grano - la 28')
        expect(n.body).toMatch(/^Marta · .*26\.500 · 1 producto · P-1$/)
        expect(n.route).toBe('/?notifications=open')
    })

    it('sin monto: igual avisa con la referencia', () => {
        expect(
            otherBranchSystemNotification({ kind: 'request', reference: 'P-1', company_id: 20 })
                .body
        ).toBe('Pedido P-1')
    })

    it('el deduper deja pasar el mismo evento una sola vez en la ventana', () => {
        const allow = createEventDeduper(1000)
        const event = { kind: 'created' as const, reference: 'P-1', order_id: 4 }
        expect(allow(event, 0)).toBe(true)
        expect(allow(event, 500)).toBe(false)
        expect(allow({ ...event, kind: 'updated' }, 600)).toBe(true)
        expect(allow(event, 2000)).toBe(true)
    })
})
