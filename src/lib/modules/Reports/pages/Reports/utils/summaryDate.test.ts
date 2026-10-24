import { describe, expect, it } from 'vitest'
import { summaryDateLabel } from './summaryDate'

describe('summaryDateLabel', () => {
    it('hoy y ayer', () => {
        expect(summaryDateLabel('2026-10-24', '2026-10-24')).toBe('Hoy')
        expect(summaryDateLabel('2026-10-23', '2026-10-24')).toBe('Ayer')
    })

    it('ayer cruzando mes y año', () => {
        expect(summaryDateLabel('2026-09-30', '2026-10-01')).toBe('Ayer')
        expect(summaryDateLabel('2025-12-31', '2026-01-01')).toBe('Ayer')
    })

    it('otros días con fecha completa', () => {
        expect(summaryDateLabel('2026-10-05', '2026-10-24')).toBe('5 oct 2026')
    })
})
