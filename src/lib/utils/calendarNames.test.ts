import { describe, expect, it } from 'vitest'
import { MONTHS_LONG, MONTHS_SHORT, WEEKDAYS_SHORT, formatDayMonth, parseDateKey } from './calendarNames'

describe('nombres de calendario', () => {
    it('12 meses y 7 días; septiembre es "sep" como en dayjs', () => {
        expect(MONTHS_SHORT).toHaveLength(12)
        expect(MONTHS_LONG).toHaveLength(12)
        expect(WEEKDAYS_SHORT).toHaveLength(7)
        expect(MONTHS_SHORT[8]).toBe('sep')
    })

    it('parseDateKey lee la fecha en local', () => {
        const d = parseDateKey('2026-10-01')
        expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 9, 1])
    })

    it('formatDayMonth con y sin año', () => {
        expect(formatDayMonth(new Date(2026, 8, 3))).toBe('3 sep')
        expect(formatDayMonth(new Date(2026, 8, 3), true)).toBe('3 sep 2026')
    })
})
