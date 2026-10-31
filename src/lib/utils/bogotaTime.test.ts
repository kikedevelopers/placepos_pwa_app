import { describe, expect, it } from 'vitest'
import {
    bogotaDayNumber,
    bogotaParts,
    longDateTimeLabel,
    shortDateLabel,
    timeLabel
} from './bogotaTime'

describe('bogotaTime', () => {
    it('lee la hora de Bogotá (UTC−5) sin importar la zona del equipo', () => {
        // 03:30 UTC del 29 = 22:30 del 28 en Bogotá.
        expect(bogotaParts('2026-10-29T03:30:00Z')).toEqual({
            year: 2026,
            month: 9,
            day: 28,
            weekday: 3,
            hour: 22,
            minute: 30
        })
    })

    it('fecha inválida → null', () => {
        expect(bogotaParts('nada')).toBeNull()
        expect(bogotaDayNumber('nada')).toBeNull()
    })

    it('el día cambia a medianoche de Bogotá, no de UTC', () => {
        const before = bogotaDayNumber('2026-10-29T04:59:00Z')
        const after = bogotaDayNumber('2026-10-29T05:00:00Z')
        expect(after! - before!).toBe(1)
    })

    it('formatos en español', () => {
        const parts = bogotaParts('2026-10-28T21:05:00Z')!
        expect(timeLabel(parts)).toBe('4:05 p. m.')
        expect(shortDateLabel(parts)).toBe('28 oct')
        expect(shortDateLabel(parts, true)).toBe('28 oct 2026')
        expect(longDateTimeLabel(parts)).toBe('miércoles 28 de octubre, 4:05 p. m.')
        expect(timeLabel(bogotaParts('2026-10-28T05:00:00Z')!)).toBe('12:00 a. m.')
        expect(timeLabel(bogotaParts('2026-10-28T17:00:00Z')!)).toBe('12:00 p. m.')
    })
})
