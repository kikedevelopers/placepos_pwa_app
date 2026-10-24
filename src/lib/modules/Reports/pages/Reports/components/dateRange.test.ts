import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RANGE_PRESETS, makeRange, presetRange, rangeCaption, rangeLabel } from './dateRange'

describe('rangos de fecha de Informes', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date(2026, 9, 24, 15, 0)) // sáb 24 oct 2026
    })
    afterEach(() => {
        vi.useRealTimers()
    })

    it('todos los presets terminan hoy', () => {
        for (const p of RANGE_PRESETS) expect(presetRange(p.id).to).toBe('2026-10-24')
    })

    it('inicio de cada preset', () => {
        expect(presetRange('today').from).toBe('2026-10-24')
        expect(presetRange('week').from).toBe('2026-10-19') // lunes
        expect(presetRange('biweek').from).toBe('2026-10-16')
        expect(presetRange('month').from).toBe('2026-10-01')
        expect(presetRange('quarter').from).toBe('2026-10-01')
        expect(presetRange('semester').from).toBe('2026-07-01')
        expect(presetRange('year').from).toBe('2026-01-01')
    })

    it('la semana arranca el lunes también cuando hoy es domingo', () => {
        vi.setSystemTime(new Date(2026, 9, 25, 10))
        expect(presetRange('week').from).toBe('2026-10-19')
    })

    it('primera quincena empieza el 1', () => {
        vi.setSystemTime(new Date(2026, 9, 15, 10))
        expect(presetRange('biweek').from).toBe('2026-10-01')
    })

    it('custom arranca en hoy–hoy', () => {
        expect(makeRange('custom')).toEqual({ mode: 'custom', from: '2026-10-24', to: '2026-10-24' })
    })

    it('etiquetas', () => {
        expect(rangeLabel(makeRange('month'))).toBe('Mes')
        expect(rangeLabel(makeRange('custom'))).toBe('Personalizado')
    })

    it('rangeCaption: un día o un rango', () => {
        expect(rangeCaption({ from: '2026-10-24', to: '2026-10-24' })).toMatch(/^24 oct$/)
        expect(rangeCaption({ from: '2026-10-01', to: '2026-10-24' })).toBe('1 oct – 24 oct')
    })
})
