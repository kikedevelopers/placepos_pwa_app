import { describe, expect, it } from 'vitest'
import { daysInMonthOf } from './comparativeDay'

describe('daysInMonthOf', () => {
    it('meses de 31, 30, febrero común y bisiesto', () => {
        expect(daysInMonthOf('2026-10-24')).toBe(31)
        expect(daysInMonthOf('2026-09-01')).toBe(30)
        expect(daysInMonthOf('2026-02-10')).toBe(28)
        expect(daysInMonthOf('2028-02-10')).toBe(29)
    })
})
