import { describe, expect, it } from 'vitest'
import { render } from 'svelte/server'
import type { AgentOrder } from '$lib/api/requests/agentOrders/types'
import AgentOrderRow from '../components/AgentOrderRow.svelte'
import AgentOrderDetail from '../components/AgentOrderDetail.svelte'
import StatusPill from '../components/StatusPill.svelte'
import TicketChip from '../components/TicketChip.svelte'

const html = (component: unknown, props: Record<string, unknown>) =>
    render(component as never, { props } as never).body
const text = (body: string) => body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')

const order = (patch: Partial<AgentOrder> = {}): AgentOrder => ({
    id: 10,
    reference: 'P-43D82A4E',
    status: 'pending',
    channel: 'whatsapp-web',
    channel_account: '573110000000',
    chat_id: '573161384577@s.whatsapp.net',
    chat_display_name: 'Enrique',
    chat_phone: '573161384577',
    customer_name: 'Marta Aranda',
    customer_phone: null,
    delivery_mode: 'recoger',
    delivery_address: null,
    payment_method: 'Efectivo',
    notes: null,
    items: [
        { product_id: 1, name: 'Uva pasa libra', quantity: '3.0000', unit_price: '8000.00', total: '24000.00' },
        { product_id: 2, name: 'Maní dulce media libra', quantity: '4.0000', unit_price: '4500.00', total: '18000.00' }
    ],
    items_count: 2,
    total: 42000,
    status_note: null,
    status_changed_at: null,
    status_changed_by: null,
    ticket: null,
    customer_updated_at: null,
    cancelled_by_customer: false,
    customer_request: null,
    customer_request_at: null,
    created_at: '2026-10-31T14:35:00.000Z',
    ...patch
})

const detail = (patch: Partial<AgentOrder> = {}, props: Record<string, unknown> = {}) =>
    text(
        html(AgentOrderDetail, {
            order: order(patch),
            isUpdating: false,
            error: null,
            canUsePos: true,
            onChangeStatus: async () => true,
            onTakeToPos: () => {},
            onOpenTicket: () => {},
            ...props
        })
    )

describe('AgentOrderRow', () => {
    it('quién, qué pidió, referencia y total', () => {
        const out = text(html(AgentOrderRow, { order: order(), onSelect: () => {} }))
        expect(out).toContain('Marta Aranda')
        expect(out).toContain('Uva pasa libra · Maní dulce media libra')
        expect(out).toContain('P-43D82A4E')
        expect(out).toMatch(/\$\s?42\.000/)
    })

    it('marca lo que pide atención: solicitud del cliente o pedido actualizado', () => {
        expect(text(html(AgentOrderRow, { order: order({ customer_request: 'Cambiar dirección' }), onSelect: () => {} }))).toContain(
            'Pide un cambio'
        )
        expect(
            text(html(AgentOrderRow, { order: order({ customer_updated_at: '2026-10-31T14:40:00Z' }), onSelect: () => {} }))
        ).toContain('Actualizado')
    })

    it('con showStatus muestra el estado (en "Todos")', () => {
        const out = text(html(AgentOrderRow, { order: order({ status: 'taken' }), showStatus: true, onSelect: () => {} }))
        expect(out).toContain('Tomado')
    })
})

describe('StatusPill / TicketChip', () => {
    it('distingue el descarte del cliente', () => {
        expect(text(html(StatusPill, { order: { status: 'dismissed', cancelled_by_customer: true } }))).toContain(
            'Cancelado por el cliente'
        )
    })

    it('el chip del ticket dice el consecutivo y si es crédito', () => {
        const out = text(
            html(TicketChip, {
                ticket: { id: 5, type: 'SALE', number: 'VTA-1054', is_credit: true, is_voided: false },
                onOpen: () => {}
            })
        )
        expect(out).toContain('VTA-1054')
        expect(out).toContain('Crédito')
    })
})

describe('AgentOrderDetail', () => {
    it('datos para facturar sin volver al chat', () => {
        const out = detail()
        expect(out).toContain('Marta Aranda')
        expect(out).toContain('+57 316 138 4577')
        expect(out).toContain('Escribirle')
        expect(out).toContain('Recoge en el negocio')
        expect(out).toContain('Efectivo')
        expect(out).toContain('Uva pasa libra')
        expect(out).toMatch(/\$\s?8\.000 c\/u/)
    })

    it('por tomar: llevar al POS, tomado y descartar', () => {
        const out = detail()
        expect(out).toContain('Llevar al POS')
        expect(out).toContain('Tomado')
        expect(out).toContain('Descartar')
        expect(out).not.toContain('Devolver a por tomar')
    })

    it('sin acceso al POS: no ofrece llevarlo', () => {
        const out = detail({}, { canUsePos: false })
        expect(out).not.toContain('Llevar al POS')
        expect(out).toContain('Tomado')
    })

    it('en un ticket vivo: ver el ticket; no se puede devolver', () => {
        const out = detail({
            status: 'taken',
            status_changed_by: 'Ana',
            ticket: { id: 9, type: 'ORDER', number: 'PED-12', is_credit: false, is_voided: false }
        })
        expect(out).toContain('Ver ticket PED-12')
        expect(out).toContain('Tomado por Ana')
        expect(out).toContain('anúlalo para devolverlo')
        expect(out).not.toContain('Llevar al POS')
    })

    it('descartado sin ticket: se puede devolver a por tomar y se ve el motivo', () => {
        const out = detail({ status: 'dismissed', status_note: 'Duplicado' })
        expect(out).toContain('Devolver a por tomar')
        expect(out).toContain('“Duplicado”')
    })

    it('solicitud del cliente sobre un pedido tomado: se avisa arriba', () => {
        const out = detail({ status: 'taken', customer_request: 'Que sean 2 libras' })
        expect(out).toContain('El cliente pidió un cambio')
        expect(out).toContain('Que sean 2 libras')
    })

    it('muestra el error de la acción', () => {
        expect(detail({}, { error: 'Este pedido ya fue tomado.' })).toContain('Este pedido ya fue tomado.')
    })
})
