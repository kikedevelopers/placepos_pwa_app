import type { CreditReportItem } from '$lib/api/requests/reports/types'
import type { Tone } from '$lib/components/premium/tones'

/**
 * Presentación de un crédito de la Cartera (pura y testeada). El vencimiento
 * sigue la regla de placepos: solo créditos con saldo; vencido (rojo), vence
 * hoy (ámbar) o días restantes (neutro).
 */
export interface CreditRowModel {
    number: string
    statusLabel: string
    statusTone: Tone
    dueLabel: string | null
    dueTone: Tone
    overdue: boolean
    /** 0..1: cuánto del total ya se abonó (para la barra de progreso). */
    paidRatio: number
}

const ONE_DAY = 86_400_000

const startOfDay = (d: Date): number => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()

/** Días entre hoy y el vencimiento (negativo = vencido). Fechas "YYYY-MM-DD" se leen en local. */
export function daysUntil(dueDate: string, now: Date): number {
    const only = /^\d{4}-\d{2}-\d{2}$/.test(dueDate)
    const due = only ? new Date(`${dueDate}T00:00:00`) : new Date(dueDate)
    return Math.round((startOfDay(due) - startOfDay(now)) / ONE_DAY)
}

const STATUS: Record<CreditReportItem['status'], { label: string; tone: Tone }> = {
    PENDING: { label: 'Pendiente', tone: 'warning' },
    PARTIALLY_PAID: { label: 'Abonado', tone: 'brand' },
    PAID: { label: 'Pagado', tone: 'positive' }
}

export function creditRowModel(c: CreditReportItem, now: Date = new Date()): CreditRowModel {
    const status = STATUS[c.status] ?? STATUS.PENDING
    const paidRatio = c.totalAmount > 0 ? Math.min(1, Math.max(0, c.paidAmount / c.totalAmount)) : 0

    let dueLabel: string | null = null
    let dueTone: Tone = 'muted'
    let overdue = false
    if (c.status !== 'PAID' && c.balance > 0 && c.dueDate) {
        const days = daysUntil(c.dueDate, now)
        const s = (n: number) => (Math.abs(n) === 1 ? '' : 's')
        if (days < 0) {
            overdue = true
            dueTone = 'negative'
            dueLabel = `Vencido hace ${Math.abs(days)} día${s(days)}`
        } else if (days === 0) {
            dueTone = 'warning'
            dueLabel = 'Vence hoy'
        } else {
            dueLabel = `Vence en ${days} día${s(days)}`
        }
    }

    return {
        number: c.saleNumber ?? c.ticketNumber,
        statusLabel: status.label,
        statusTone: status.tone,
        dueLabel,
        dueTone,
        overdue,
        paidRatio
    }
}

/** Iniciales para el avatar del cliente ("Ana María Pérez" → "AP"). */
export function initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) return '?'
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
