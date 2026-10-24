import { describe, expect, it } from 'vitest'
import { calendarDueDates, computeCalendarSchedule, isCalendarUnit } from './periodSchedule'

// Vectores V1–V5 del contrato (pos_api fixed-expenses sync-due-periods.action.spec.ts),
// en hora Colombia (UTC−5 fijo).
const startAt = (ymd: string): number => Date.parse(`${ymd}T00:00:00-05:00`)
const day15 = (ym: string): string => new Date(Date.parse(`${ym}-15T23:59:59.999-05:00`)).toISOString()
const endOfMonth = (ym: string): string => {
    const [y, m] = ym.split('-').map(Number)
    const last = new Date(Date.UTC(y, m, 0)).getUTCDate()
    return new Date(Date.parse(`${ym}-${String(last).padStart(2, '0')}T23:59:59.999-05:00`)).toISOString()
}
const iso = (list: number[]) => list.map((ms) => new Date(ms).toISOString())

describe('cortes de calendario — vectores del contrato', () => {
    it('V1 — Mensual, start 2026-01-10', () => {
        expect(iso(calendarDueDates(startAt('2026-01-10'), 'end_of_month', 4))).toEqual([
            endOfMonth('2026-01'),
            endOfMonth('2026-02'),
            endOfMonth('2026-03'),
            endOfMonth('2026-04')
        ])
    })

    it('V2 — Quincenal, start 2026-02-01', () => {
        expect(iso(calendarDueDates(startAt('2026-02-01'), 'semimonthly', 4))).toEqual([
            day15('2026-02'),
            endOfMonth('2026-02'),
            day15('2026-03'),
            endOfMonth('2026-03')
        ])
    })

    it('V3 — Quincenal, start 2026-02-20 omite el 15 anterior', () => {
        expect(iso(calendarDueDates(startAt('2026-02-20'), 'semimonthly', 3))).toEqual([
            endOfMonth('2026-02'),
            day15('2026-03'),
            endOfMonth('2026-03')
        ])
    })

    it('V4 — Quincenal, bisiesto: febrero 2024 cierra el 29', () => {
        const dates = calendarDueDates(startAt('2024-02-01'), 'semimonthly', 3)
        expect(iso(dates)).toEqual([day15('2024-02'), endOfMonth('2024-02'), day15('2024-03')])
        expect(new Date(dates[1] - 5 * 3_600_000).getUTCDate()).toBe(29)
    })

    it('V5 — start exactamente en un ancla NO dispara ese corte', () => {
        const start = Date.parse('2026-01-31T23:59:59.999-05:00')
        expect(iso(calendarDueDates(start, 'end_of_month', 1))).toEqual([endOfMonth('2026-02')])
    })

    it('solo semimonthly y end_of_month son de calendario', () => {
        expect(isCalendarUnit('semimonthly')).toBe(true)
        expect(isCalendarUnit('end_of_month')).toBe(true)
        expect(isCalendarUnit('month')).toBe(false)
    })
})

describe('computeCalendarSchedule', () => {
    const start = startAt('2026-06-01')

    it('periodo actual entre la última ancla cumplida y la próxima', () => {
        const now = Date.parse('2026-10-24T15:00:00-05:00')
        const s = computeCalendarSchedule(start, now, 'semimonthly')
        // jun(2) + jul(2) + ago(2) + sep(2) + 15 oct = 9 cortes cumplidos.
        expect(s.completedPeriods).toBe(9)
        expect(new Date(s.currentPeriodStart).toISOString()).toBe(day15('2026-10'))
        expect(new Date(s.currentPeriodEnd).toISOString()).toBe(endOfMonth('2026-10'))
    })

    it('antes del inicio: cero cortes, periodo [start, a1]', () => {
        const s = computeCalendarSchedule(start, start - 1000, 'end_of_month')
        expect(s.completedPeriods).toBe(0)
        expect(s.currentPeriodStart).toBe(start)
        expect(new Date(s.currentPeriodEnd).toISOString()).toBe(endOfMonth('2026-06'))
    })

    it('antes del primer corte: empieza en el inicio', () => {
        const s = computeCalendarSchedule(start, Date.parse('2026-06-10T10:00:00-05:00'), 'semimonthly')
        expect(s.completedPeriods).toBe(0)
        expect(s.currentPeriodStart).toBe(start)
        expect(new Date(s.currentPeriodEnd).toISOString()).toBe(day15('2026-06'))
    })

    it('justo en un ancla ese corte ya cuenta como cumplido', () => {
        const anchor = Date.parse(day15('2026-06'))
        expect(computeCalendarSchedule(start, anchor, 'semimonthly').completedPeriods).toBe(1)
    })
})
