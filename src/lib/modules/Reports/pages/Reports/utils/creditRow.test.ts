import { describe, expect, it } from 'vitest'
import type { CreditReportItem } from '$lib/api/requests/reports/types'
import { creditRowModel, daysUntil, initials } from './creditRow'

const NOW = new Date(2026, 9, 24, 15, 0)

const credit = (over: Partial<CreditReportItem> = {}): CreditReportItem => ({
    id: 1,
    creditId: 1,
    ticketNumber: 'T-1',
    saleNumber: 'VTA-1',
    customerName: 'Ana Pérez',
    createdBy: 'Kike',
    synced: true,
    createdAt: '2026-10-01T10:00:00.000Z',
    totalAmount: 100000,
    paidAmount: 25000,
    balance: 75000,
    status: 'PARTIALLY_PAID',
    dueDate: '2026-10-30',
    ...over
})

describe('daysUntil', () => {
    it('fecha sola se lee en local, sin correrse un día', () => {
        expect(daysUntil('2026-10-24', NOW)).toBe(0)
        expect(daysUntil('2026-10-25', NOW)).toBe(1)
        expect(daysUntil('2026-10-20', NOW)).toBe(-4)
    })
})

describe('creditRowModel', () => {
    it('crédito al día: días restantes, neutro', () => {
        const m = creditRowModel(credit(), NOW)
        expect(m).toMatchObject({ number: 'VTA-1', dueLabel: 'Vence en 6 días', dueTone: 'muted', overdue: false })
    })

    it('vence hoy (ámbar) y vence mañana (singular)', () => {
        expect(creditRowModel(credit({ dueDate: '2026-10-24' }), NOW)).toMatchObject({ dueLabel: 'Vence hoy', dueTone: 'warning' })
        expect(creditRowModel(credit({ dueDate: '2026-10-25' }), NOW).dueLabel).toBe('Vence en 1 día')
    })

    it('vencido en rojo', () => {
        const m = creditRowModel(credit({ dueDate: '2026-10-23' }), NOW)
        expect(m).toMatchObject({ dueLabel: 'Vencido hace 1 día', dueTone: 'negative', overdue: true })
    })

    it('pagado o sin saldo o sin fecha: no muestra vencimiento', () => {
        expect(creditRowModel(credit({ status: 'PAID', balance: 0, dueDate: '2026-01-01' }), NOW).dueLabel).toBeNull()
        expect(creditRowModel(credit({ balance: 0, dueDate: '2026-01-01' }), NOW).overdue).toBe(false)
        expect(creditRowModel(credit({ dueDate: null }), NOW).dueLabel).toBeNull()
    })

    it('estado y proporción abonada', () => {
        expect(creditRowModel(credit(), NOW)).toMatchObject({ statusLabel: 'Abonado', paidRatio: 0.25 })
        expect(creditRowModel(credit({ status: 'PENDING', paidAmount: 0 }), NOW)).toMatchObject({ statusLabel: 'Pendiente', paidRatio: 0 })
        expect(creditRowModel(credit({ status: 'PAID', paidAmount: 100000, balance: 0 }), NOW).statusLabel).toBe('Pagado')
    })

    it('la proporción se acota a 0..1 y tolera total 0', () => {
        expect(creditRowModel(credit({ paidAmount: 150000 }), NOW).paidRatio).toBe(1)
        expect(creditRowModel(credit({ totalAmount: 0 }), NOW).paidRatio).toBe(0)
    })

    it('sin número de venta usa el del ticket', () => {
        expect(creditRowModel(credit({ saleNumber: null }), NOW).number).toBe('T-1')
    })
})

describe('initials', () => {
    it('primera y última palabra', () => {
        expect(initials('Ana María Pérez')).toBe('AP')
        expect(initials('consumidor')).toBe('CO')
        expect(initials('  ')).toBe('?')
    })
})
