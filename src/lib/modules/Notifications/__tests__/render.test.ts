import { describe, expect, it } from 'vitest'
import { render } from 'svelte/server'
import type { AppAlert } from '$lib/api/requests/appAlerts/types'
import NotificationRow from '../components/NotificationRow.svelte'

const html = (props: Record<string, unknown>) =>
    render(NotificationRow as never, { props } as never).body
const text = (body: string) => body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')

const alert = (patch: Partial<AppAlert> = {}): AppAlert => ({
    id: 1,
    alert_type: 'AGENT_ORDER_NEW',
    title: 'Nuevo pedido del agente',
    payload: {
        message: 'Ana hizo el pedido P-1 por $ 18.000 (1 producto).',
        reference: 'P-1',
        total: 18000,
        order_id: 4
    },
    is_read: false,
    read_at: null,
    triggered_at: '2026-10-31T14:00:00Z',
    created_at: '2026-10-31T14:00:00Z',
    ...patch
})

const base = { hasTarget: true, onOpen: () => {}, onMarkRead: () => {} }

describe('NotificationRow', () => {
    it('título, mensaje, referencia y monto', () => {
        const out = text(html({ ...base, alert: alert() }))
        expect(out).toContain('Nuevo pedido del agente')
        expect(out).toContain('Ana hizo el pedido P-1')
        expect(out).toContain('P-1')
        expect(out).toMatch(/\$\s?18\.000/)
    })

    it('sin leer: botón para marcarla; leída: no', () => {
        expect(html({ ...base, alert: alert() })).toContain('Marcar como leída')
        expect(html({ ...base, alert: alert({ is_read: true }) })).not.toContain('Marcar como leída')
    })

    it('de otra sucursal: lleva el nombre de la sucursal', () => {
        expect(text(html({ ...base, alert: alert(), branchName: 'La 28' }))).toContain('La 28')
    })

    it('servidor viejo sin título: uno por tipo', () => {
        expect(text(html({ ...base, alert: alert({ title: undefined, alert_type: 'AGENT_ORDER_CANCELLED' }) }))).toContain(
            'El cliente canceló su pedido'
        )
    })
})
