import { describe, it, expect } from 'vitest'
import type { AppAlert } from '$lib/api/requests/appAlerts/types'
import {
    categoryOf,
    compactTime,
    countByCategory,
    groupByDay,
    isInHistory,
    otherBranchOf,
    targetOf,
    titleOf,
    toneOf
} from './notifications'

const alert = (patch: Partial<AppAlert> = {}): AppAlert => ({
    id: 1,
    alert_type: 'AGENT_ORDER_NEW',
    title: 'Nuevo pedido del agente',
    severity: 'INFO',
    payload: { message: 'Ana hizo el pedido P-1', order_id: 4, reference: 'P-1', total: 26500 },
    is_read: false,
    read_at: null,
    triggered_at: '2026-10-31T15:00:00.000Z',
    created_at: '2026-10-31T15:00:00.000Z',
    ...patch
})

// 3:00 p. m. del 31 de octubre en Bogotá.
const now = new Date('2026-10-31T20:00:00.000Z')

describe('categoryOf / toneOf / titleOf', () => {
    it('clasifica por tipo', () => {
        expect(categoryOf(alert())).toBe('orders')
        expect(categoryOf(alert({ alert_type: 'AGENT_ORDER_REQUEST' }))).toBe('orders')
        expect(categoryOf(alert({ alert_type: 'FIXED_EXPENSE_DUE' }))).toBe('expenses')
        expect(categoryOf(alert({ alert_type: 'INACTIVE_CUSTOMER' }))).toBe('customers')
        expect(categoryOf(alert({ alert_type: 'OTRA_COSA' }))).toBe('other')
    })

    it('cada evento del cliente tiene su tono', () => {
        expect(toneOf(alert())).toBe('order')
        expect(toneOf(alert({ alert_type: 'AGENT_ORDER_UPDATED' }))).toBe('order-updated')
        expect(toneOf(alert({ alert_type: 'AGENT_ORDER_CANCELLED' }))).toBe('order-cancelled')
        expect(toneOf(alert({ alert_type: 'AGENT_ORDER_REQUEST' }))).toBe('order-request')
        expect(toneOf(alert({ alert_type: 'FIXED_EXPENSE_DUE' }))).toBe('expense')
        expect(toneOf(alert({ alert_type: 'X' }))).toBe('neutral')
    })

    it('título del servidor; si no viene (servidor viejo), uno por tipo', () => {
        expect(titleOf(alert())).toBe('Nuevo pedido del agente')
        expect(titleOf(alert({ title: undefined, alert_type: 'FIXED_EXPENSE_DUE' }))).toBe(
            'Gasto fijo por pagar'
        )
        expect(titleOf(alert({ title: '  ', alert_type: 'X' }))).toBe('Notificación')
    })
})

describe('targetOf', () => {
    it('pedido del agente → el informe con ese pedido', () => {
        expect(targetOf(alert())).toBe('/reportes?tab=agente&order=4')
    })

    it('gasto fijo → su ficha resaltada', () => {
        expect(
            targetOf(
                alert({
                    alert_type: 'FIXED_EXPENSE_DUE',
                    payload: { message: 'x', fixed_expense_id: 9 }
                })
            )
        ).toBe('/gastos?tab=fixed&highlight=9')
    })

    it('sin datos para abrir → null', () => {
        expect(targetOf(alert({ payload: { message: 'x' } }))).toBeNull()
        expect(
            targetOf(alert({ alert_type: 'INACTIVE_CUSTOMER', payload: { message: 'x' } }))
        ).toBeNull()
    })
})

describe('groupByDay', () => {
    it('agrupa en Hoy, Ayer, Esta semana y Anteriores (hora Colombia), sin grupos vacíos', () => {
        const groups = groupByDay(
            [
                alert({ id: 1, triggered_at: '2026-10-31T19:00:00.000Z' }),
                // 8 p. m. del 30 en Bogotá → Ayer, aunque en UTC ya sea 31.
                alert({ id: 2, triggered_at: '2026-10-31T01:00:00.000Z' }),
                alert({ id: 3, triggered_at: '2026-10-27T15:00:00.000Z' }),
                alert({ id: 4, triggered_at: '2026-09-01T15:00:00.000Z' })
            ],
            now
        )
        expect(groups.map((g) => [g.label, g.alerts.map((a) => a.id)])).toEqual([
            ['Hoy', [1]],
            ['Ayer', [2]],
            ['Esta semana', [3]],
            ['Anteriores', [4]]
        ])
        expect(
            groupByDay([alert({ triggered_at: '2026-10-31T19:00:00.000Z' })], now).map(
                (g) => g.label
            )
        ).toEqual(['Hoy'])
    })
})

describe('compactTime', () => {
    it('reciente, hoy, ayer, esta semana y antes', () => {
        expect(compactTime('2026-10-31T19:59:40.000Z', now)).toBe('ahora')
        expect(compactTime('2026-10-31T19:55:00.000Z', now)).toBe('hace 5 min')
        expect(compactTime('2026-10-31T17:30:00.000Z', now)).toBe('hace 2 h')
        expect(compactTime('2026-10-31T12:30:00.000Z', now)).toMatch(/^7:30 a/)
        expect(compactTime('2026-10-31T01:00:00.000Z', now)).toBe('ayer')
        expect(compactTime('2026-10-27T15:00:00.000Z', now)).toBe('martes')
        expect(compactTime('2026-09-01T15:00:00.000Z', now)).toBe('1 sep')
        expect(compactTime('2025-09-01T15:00:00.000Z', now)).toBe('1 sep 2025')
        expect(compactTime('no-es-fecha', now)).toBe('')
    })
})

describe('countByCategory', () => {
    it('cuenta por tipo', () => {
        expect(
            countByCategory([
                alert(),
                alert({ alert_type: 'AGENT_ORDER_REQUEST' }),
                alert({ alert_type: 'FIXED_EXPENSE_DUE' })
            ])
        ).toEqual({ orders: 2, expenses: 1, customers: 0, other: 0 })
    })
})

describe('isInHistory', () => {
    it('no leídas: siempre, aunque sean viejas', () => {
        expect(isInHistory({ is_read: false, triggered_at: '2026-01-01T00:00:00.000Z' }, now)).toBe(
            true
        )
    })

    it('leídas: solo las de los últimos 7 días', () => {
        expect(isInHistory({ is_read: true, triggered_at: '2026-10-25T20:00:00.000Z' }, now)).toBe(
            true
        )
        expect(isInHistory({ is_read: true, triggered_at: '2026-10-24T20:00:00.000Z' }, now)).toBe(
            true
        )
        expect(isInHistory({ is_read: true, triggered_at: '2026-10-24T19:59:00.000Z' }, now)).toBe(
            false
        )
        expect(isInHistory({ is_read: true, triggered_at: '2026-09-01T15:00:00.000Z' }, now)).toBe(
            false
        )
        expect(isInHistory({ is_read: true, triggered_at: 'raro' }, now)).toBe(false)
    })
})

describe('sucursales (dueño)', () => {
    const branch = alert({ company_id: 20, company_name: 'Esencia & Grano - la 28' })

    it('otra sucursal: su nombre; la misma (o sin dato): null', () => {
        expect(otherBranchOf(branch, 13)).toBe('Esencia & Grano - la 28')
        expect(otherBranchOf(branch, 20)).toBeNull()
        expect(otherBranchOf(alert(), 13)).toBeNull()
        expect(otherBranchOf(branch, null)).toBeNull()
        expect(otherBranchOf(alert({ company_id: 20, company_name: null }), 13)).toBe(
            'otra sucursal'
        )
    })

    it('lo de otra sucursal no se abre desde aquí; lo de esta sí', () => {
        expect(targetOf(branch, 13)).toBeNull()
        expect(targetOf(branch, 20)).toBe('/reportes?tab=agente&order=4')
    })
})
