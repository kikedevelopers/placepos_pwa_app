import { describe, expect, it, vi } from 'vitest'
import { render } from 'svelte/server'
import type { CreditReportItem, DailyClosure, SalesReportTicket } from '$lib/api/requests/reports/types'
import { buildDayBreakdown } from '../utils/buildDayBreakdown'
import { buildMetricComparisons } from '../utils/comparisonModel'
import DayBreakdownSections from '../components/DayBreakdownSections.svelte'
import SaleRow from '../components/SaleRow.svelte'
import CreditRow from '../components/CreditRow.svelte'
import MetricComparisonCard from '../components/MetricComparisonCard.svelte'
import MoneyDistribution from '../components/MoneyDistribution.svelte'
import SalesByHourChart from '../components/SalesByHourChart.svelte'

// El visor de tickets arrastra el entorno de SvelteKit; aquí solo importa que
// las filas lo llamen, no abrirlo.
vi.mock('$lib/components/TicketViewer', () => ({ ticketViewer: { open: vi.fn() } }))

const html = (component: unknown, props: Record<string, unknown>) =>
    render(component as never, { props } as never).body
const text = (body: string) => body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')

// Mismo día de prueba que buildDayBreakdown.test.ts (fixture de placepos).
const closure = (over: Record<string, unknown> = {}): DailyClosure =>
    ({
        date: '2026-07-22',
        cashSalesTotal: 10000,
        consignacionesVentas: 4000,
        consignacionesDetalle: [{ bankName: 'Nequi', amount: 4000 }],
        ordersTotal: 0,
        salesProfit: 5000,
        salesMargin: 25,
        expensesTotal: 1500,
        carrierPaymentsTotal: 800,
        creditsBreakdown: {
            newCreditsCount: 1,
            newCreditsTotal: 6000,
            newCreditsProfit: 2000,
            newCreditsMargin: 33.33,
            abonosCash: 4000,
            abonosConsignacion: 2000,
            abonosConsignacionDetalle: [{ bankName: 'Bancolombia', amount: 2000 }],
            abonosTotal: 6000,
            abonosByCreditAge: {
                previous: { cash: 3000, consignacion: 2000, consignacionDetalle: [{ bankName: 'Bancolombia', amount: 2000 }], total: 5000, profit: 1000, margin: 20 },
                today: { cash: 1000, consignacion: 0, consignacionDetalle: [], total: 1000, profit: 300, margin: 30 }
            },
            pendingBalance: 6000
        },
        ...over
    }) as unknown as DailyClosure

describe('DayBreakdownSections — espejo de placepos', () => {
    it('secciones A–E en el orden de placepos', () => {
        const t = text(html(DayBreakdownSections, { b: buildDayBreakdown(closure(), 700) }))
        const order = [
            'Efectivo recaudado',
            'Consignaciones recaudadas',
            'Total recogido en el día',
            'Venta del día',
            'Salidas de dinero',
            'Ganancia real del día'
        ].map((label) => t.indexOf(label))
        expect(order.every((i) => i >= 0)).toBe(true)
        expect([...order].sort((a, b) => a - b)).toEqual(order)
    })

    it('recaudo discriminado por edad del crédito y bancos por consignación', () => {
        const t = text(html(DayBreakdownSections, { b: buildDayBreakdown(closure(), 700) }))
        expect(t).toContain('Recaudo de créditos del día')
        expect(t).toContain('Recaudo de créditos de días anteriores')
        expect(t).toContain('Consignación — Nequi')
        expect(t).toContain('Abono — Bancolombia')
        expect(t).toContain('Días anteriores')
        expect(t).not.toContain('Recaudo de créditos en efectivo')
    })

    it('backend sin split por edad: vista plana', () => {
        const flat = closure()
        delete (flat.creditsBreakdown as Record<string, unknown>).abonosByCreditAge
        const t = text(html(DayBreakdownSections, { b: buildDayBreakdown(flat, 0) }))
        expect(t).toContain('Recaudo de créditos en efectivo')
        expect(t).not.toContain('Recaudo de créditos del día')
    })

    it('con crédito del día: subtotal de contado y crédito con su ganancia', () => {
        const t = text(html(DayBreakdownSections, { b: buildDayBreakdown(closure(), 0) }))
        expect(t).toContain('Total venta de contado')
        expect(t).toContain('Venta a crédito del día')
        expect(t).toMatch(/Gan\. \$\s?2\.000/)
        expect(t).toContain('Ganancia de crédito sin cobrar')
    })

    it('sin crédito no muestra esas filas', () => {
        const noCredit = closure({
            creditsBreakdown: { ...closure().creditsBreakdown, newCreditsTotal: 0, newCreditsProfit: 0 }
        })
        const t = text(html(DayBreakdownSections, { b: buildDayBreakdown(noCredit, 0) }))
        expect(t).not.toContain('Total venta de contado')
        expect(t).not.toContain('Ganancia de crédito sin cobrar')
    })

    it('salidas: abonos a compras y transportistas; en sucursales se oculta compras', () => {
        const b = buildDayBreakdown(closure(), 700)
        const t = text(html(DayBreakdownSections, { b }))
        expect(t).toContain('Abonos a compras')
        expect(t).toContain('Abonos a transportistas')
        expect(text(html(DayBreakdownSections, { b, hidePurchasePayments: true }))).not.toContain('Abonos a compras')
    })

    it('ganancia real negativa con signo y en rojo', () => {
        const b = buildDayBreakdown(closure({ salesProfit: 100, expensesTotal: 5000 }), 0)
        const body = html(DayBreakdownSections, { b })
        expect(b.realProfit).toBeLessThan(0)
        expect(text(body)).toMatch(/Ganancia real −\$/)
    })
})

const ticket = (over: Partial<SalesReportTicket> = {}): SalesReportTicket =>
    ({
        id: 9,
        rowType: 'INVOICE',
        ticketType: 'SALE',
        ticketNumber: 'T-9',
        saleNumber: 'VTA-9',
        consolidatedTotal: 5500,
        profit: 1300,
        margin: 23.6,
        customerName: 'Consumidor Final',
        createdAt: '2026-10-16T13:20:46.360Z',
        isDeleted: false,
        isCredit: false,
        isPending: false,
        paymentType: 'CASH',
        noteType: null,
        noteNumber: null,
        parentInvoiceId: null,
        ...over
    }) as SalesReportTicket

describe('SaleRow', () => {
    it('cliente, número, medio de pago, total y margen', () => {
        const t = text(html(SaleRow, { ticket: ticket(), canViewProfit: true }))
        expect(t).toContain('Consumidor Final')
        expect(t).toContain('VTA-9')
        expect(t).toContain('Efectivo')
        expect(t).toContain('5.500')
        expect(t).toContain('23,6 % margen')
    })

    it('sin permiso de ganancias no muestra el margen', () => {
        expect(text(html(SaleRow, { ticket: ticket(), canViewProfit: false }))).not.toContain('margen')
    })

    it('anulada: tachada y rotulada', () => {
        const body = html(SaleRow, { ticket: ticket({ isDeleted: true }), canViewProfit: true })
        expect(body).toContain('line-through')
        expect(text(body)).toContain('Anulada')
    })
})

const credit = (over: Partial<CreditReportItem> = {}): CreditReportItem => ({
    id: 1,
    creditId: 1,
    ticketNumber: 'T-1',
    saleNumber: 'VTA-1',
    customerName: 'Alonso Reyes',
    createdBy: null,
    synced: true,
    createdAt: '2026-10-16T10:00:00.000Z',
    totalAmount: 13800,
    paidAmount: 0,
    balance: 13800,
    status: 'PENDING',
    dueDate: '2020-01-01',
    ...over
})

describe('CreditRow', () => {
    it('vencido: saldo en rojo y aviso de vencimiento', () => {
        const body = html(CreditRow, { credit: credit() })
        expect(text(body)).toMatch(/Vencido hace \d+ días/)
        expect(body).toContain('text-destructive')
        expect(text(body)).toContain('AR')
    })

    it('sin abonos no hay barra; con abonos sí, con el abonado', () => {
        expect(text(html(CreditRow, { credit: credit() }))).not.toContain('abonado')
        const partial = text(html(CreditRow, { credit: credit({ paidAmount: 3800, balance: 10000, status: 'PARTIALLY_PAID' }) }))
        expect(partial).toContain('abonado')
        expect(partial).toContain('3.800')
    })
})

describe('MetricComparisonCard', () => {
    it('cifra actual, variación y una barra por periodo', () => {
        const [sales] = buildMetricComparisons([
            { label: 'Septiembre 2026', detail: '', sales: 80800, profit: 15800, margin: 19.6, growth: null },
            { label: 'Octubre 2026', detail: '', sales: 39900, profit: 8450, margin: 21.2, growth: { salesPct: -50.6, salesDelta: -40900, profitPct: -46.5, profitDelta: -7350, marginDelta: 1.6 } }
        ])
        const body = html(MetricComparisonCard, { metric: sales, previousLabel: 'Septiembre 2026' })
        expect(text(body)).toContain('−50,6 %')
        expect(text(body)).toContain('frente a Septiembre 2026')
        expect(body.match(/class="bar-fill/g)).toHaveLength(2)
        expect(body).toContain('--fill:1')
    })
})

describe('gráficas del Resumen', () => {
    it('¿Dónde está el dinero?: tres barras con sus montos', () => {
        const t = text(html(MoneyDistribution, { cash: 5500, consign: 0, credit: 13800 }))
        expect(t).toContain('Efectivo')
        expect(t).toContain('Consignación')
        expect(t).toContain('Crédito')
        expect(t).toContain('$14k')
    })

    it('Venta por horas: hora pico y ejes cada 3 horas', () => {
        const hours = Array.from({ length: 24 }, (_, hour) => ({ hour, total: hour === 8 ? 15800 : 0, count: hour === 8 ? 2 : 0 }))
        const t = text(html(SalesByHourChart, { hours }))
        expect(t).toContain('Hora pico · 8:00 a. m.')
        expect(t).toContain('máx $20k')
        expect(t).toContain('12a')
        expect(t).toContain('9p')
    })

    it('Venta por horas sin ventas: sin máximo engañoso', () => {
        const hours = Array.from({ length: 24 }, (_, hour) => ({ hour, total: 0, count: 0 }))
        const t = text(html(SalesByHourChart, { hours }))
        expect(t).toContain('Sin ventas')
        expect(t).not.toContain('máx')
    })
})
