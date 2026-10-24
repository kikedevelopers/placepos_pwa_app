import { describe, expect, it } from 'vitest'
import { render } from 'svelte/server'
import type { ExpenseRecord } from '$lib/api/requests/expenses'
import type { FixedExpense } from '$lib/api/requests/fixedExpenses'
import ConfirmSheet from '$lib/components/premium/ConfirmSheet.svelte'
import ExpenseRow from '../components/variable/ExpenseRow.svelte'
import FixedExpenseCard from '../components/fixed/FixedExpenseCard.svelte'

const html = (component: unknown, props: Record<string, unknown>) =>
    render(component as never, { props } as never).body
const text = (body: string) => body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
const isDisabled = (body: string) => /<button[^>]*\sdisabled(="")?[\s>]/.test(body)

const expense = (over: Partial<ExpenseRecord> = {}): ExpenseRecord =>
    ({
        id: 1,
        description: 'almuerzo',
        amount: 14000,
        source_type: 'cash_register',
        source_name: 'Caja de Enrique Pacheco',
        expense_date: '2026-07-14',
        is_archived: false,
        created_by: null,
        created_at: '2026-07-14T17:00:00.000Z',
        ...over
    }) as ExpenseRecord

describe('ExpenseRow', () => {
    it('descripción, fuente y monto con signo menos', () => {
        const t = text(html(ExpenseRow, { expense: expense(), onclick: () => {} }))
        expect(t).toContain('almuerzo')
        expect(t).toContain('Caja de Enrique Pacheco')
        expect(t).toMatch(/−\s*\$\s*14\.000/)
    })

    it('anulado: tachado, rotulado y no pulsable', () => {
        const body = html(ExpenseRow, { expense: expense({ is_archived: true }) })
        expect(body).toContain('line-through')
        expect(text(body)).toContain('Anulado')
        expect(isDisabled(body)).toBe(true)
    })
})

describe('ConfirmSheet', () => {
    const props = { title: 'Anular gasto', message: 'Seguro?', confirmLabel: 'Anular', onConfirm: () => {}, onClose: () => {} }

    it('cerrada no pinta nada', () => {
        expect(text(html(ConfirmSheet, { ...props, open: false }))).not.toContain('Anular gasto')
    })

    it('abierta: diálogo con acción destructiva en rojo y Cancelar', () => {
        const body = html(ConfirmSheet, { ...props, open: true, destructive: true })
        expect(body).toContain('role="dialog"')
        expect(body).toContain('bg-destructive')
        expect(text(body)).toContain('Cancelar')
    })

    it('muestra el error como alerta y bloquea mientras carga', () => {
        const body = html(ConfirmSheet, { ...props, open: true, error: 'Sin saldo', loading: true })
        expect(body).toContain('role="alert"')
        expect(text(body)).toContain('Sin saldo')
        expect(isDisabled(body)).toBe(true)
    })
})

describe('FixedExpenseCard', () => {
    const now = new Date(Date.parse('2026-10-24T15:00:00-05:00'))
    const fixed = (over: Partial<FixedExpense> = {}): FixedExpense =>
        ({
            id: 2,
            name: 'NOMINA DIANA',
            description: null,
            amount: 900000,
            period_unit: 'semimonthly',
            period_quantity: 1,
            start_date: '2026-06-01T17:00:00.000Z',
            pending_periods_count: 8,
            pending_periods_total: 7200000,
            ...over
        }) as FixedExpense

    it('quincenal: rótulo de calendario, cortes pendientes y acciones del gestor', () => {
        const t = text(html(FixedExpenseCard, { expense: fixed(), now, canManage: true, onEdit: () => {}, onArchive: () => {} }))
        expect(t).toContain('Quincenal (día 15 y último)')
        expect(t).toContain('8 cortes pendientes')
        expect(t).toContain('Editar')
        expect(t).toContain('Archivar')
        expect(t).toMatch(/Faltan 7 d/)
    })

    it('sin cortes pendientes ni permiso: sin alerta ni acciones', () => {
        const t = text(html(FixedExpenseCard, { expense: fixed({ pending_periods_count: 0 }), now, canManage: false, onEdit: () => {}, onArchive: () => {} }))
        expect(t).not.toContain('pendiente')
        expect(t).not.toContain('Archivar')
    })
})
