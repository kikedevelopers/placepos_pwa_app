import { describe, it, expect } from 'vitest'
import { FileText, HandCoins, Landmark, Coins, BadgeCheck, Ban, History } from '@lucide/svelte'
import { formatCurrency } from '$lib/utils/numbers'
import type { SaleStatusEvent, SaleStatusEventType } from '$lib/api/requests/sales'
import { getTimelineDescriptor, formatTimelineLabel, prepareTimeline } from './statusTimeline'

const buildEvent = (overrides: Partial<SaleStatusEvent> = {}): SaleStatusEvent => ({
    eventType: 'CREATED',
    amount: null,
    createdBy: 'Ana',
    createdAt: '2026-01-01T10:00:00.000Z',
    ...overrides
})

describe('getTimelineDescriptor', () => {
    it('mapea cada tipo de evento a su etiqueta, icono y tono', () => {
        expect(getTimelineDescriptor('CREATED')).toEqual({
            label: 'Venta creada',
            icon: FileText,
            tone: 'slate'
        })
        expect(getTimelineDescriptor('COLLECTED')).toEqual({
            label: 'Cobrada',
            icon: HandCoins,
            tone: 'emerald'
        })
        expect(getTimelineDescriptor('CREDIT_OPENED')).toEqual({
            label: 'Crédito abierto',
            icon: Landmark,
            tone: 'amber'
        })
        expect(getTimelineDescriptor('INSTALLMENT')).toEqual({
            label: 'Abono',
            icon: Coins,
            tone: 'violet'
        })
        expect(getTimelineDescriptor('PAID')).toEqual({
            label: 'Pagada por completo',
            icon: BadgeCheck,
            tone: 'emerald'
        })
        expect(getTimelineDescriptor('VOIDED')).toEqual({
            label: 'Anulada',
            icon: Ban,
            tone: 'rose'
        })
    })

    it('usa un descriptor de respaldo para tipos desconocidos', () => {
        const descriptor = getTimelineDescriptor('SOMETHING_ELSE' as SaleStatusEventType)
        expect(descriptor).toEqual({ label: 'Movimiento', icon: History, tone: 'slate' })
    })
})

describe('formatTimelineLabel', () => {
    it('incluye el monto cuando el evento lo trae (crédito abierto)', () => {
        const label = formatTimelineLabel(buildEvent({ eventType: 'CREDIT_OPENED', amount: 50000 }))
        expect(label).toBe(`Crédito abierto · ${formatCurrency(50000)}`)
    })

    it('incluye el monto en un abono', () => {
        const label = formatTimelineLabel(buildEvent({ eventType: 'INSTALLMENT', amount: 10000 }))
        expect(label).toBe(`Abono · ${formatCurrency(10000)}`)
    })

    it('omite el monto cuando es null', () => {
        expect(formatTimelineLabel(buildEvent({ eventType: 'CREATED', amount: null }))).toBe(
            'Venta creada'
        )
    })

    it('omite el monto cuando es cero', () => {
        expect(formatTimelineLabel(buildEvent({ eventType: 'PAID', amount: 0 }))).toBe(
            'Pagada por completo'
        )
    })
})

describe('prepareTimeline', () => {
    it('devuelve un arreglo vacío cuando el historial es undefined', () => {
        expect(prepareTimeline(undefined)).toEqual([])
    })

    it('devuelve un arreglo vacío cuando el historial es null', () => {
        expect(prepareTimeline(null)).toEqual([])
    })

    it('devuelve un arreglo vacío cuando el historial está vacío', () => {
        expect(prepareTimeline([])).toEqual([])
    })

    it('ordena los eventos de forma ascendente por fecha', () => {
        const desordenado: SaleStatusEvent[] = [
            buildEvent({ eventType: 'PAID', createdAt: '2026-01-03T10:00:00.000Z' }),
            buildEvent({ eventType: 'CREATED', createdAt: '2026-01-01T10:00:00.000Z' }),
            buildEvent({ eventType: 'INSTALLMENT', createdAt: '2026-01-02T10:00:00.000Z' })
        ]
        const ordenado = prepareTimeline(desordenado)
        expect(ordenado.map((e) => e.eventType)).toEqual(['CREATED', 'INSTALLMENT', 'PAID'])
    })

    it('no muta el arreglo original', () => {
        const original: SaleStatusEvent[] = [
            buildEvent({ eventType: 'PAID', createdAt: '2026-01-03T10:00:00.000Z' }),
            buildEvent({ eventType: 'CREATED', createdAt: '2026-01-01T10:00:00.000Z' })
        ]
        const copia = [...original]
        prepareTimeline(original)
        expect(original).toEqual(copia)
    })
})
