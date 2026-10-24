import { describe, expect, it } from 'vitest'
import { dayKey, dayLabel, groupByDay, nextLimit, shortDate, timeLabel } from './listing'

const NOW = new Date(2026, 9, 24, 15, 0) // sáb 24 oct 2026, 3:00 p. m. local

describe('dayLabel', () => {
    it('hoy y ayer con nombre propio', () => {
        expect(dayLabel('2026-10-24', NOW)).toBe('Hoy')
        expect(dayLabel('2026-10-23', NOW)).toBe('Ayer')
    })

    it('otros días con día de la semana, sin año si es el actual', () => {
        const label = dayLabel('2026-10-21', NOW)
        expect(label).toMatch(/21/)
        expect(label).toMatch(/oct/)
        expect(label).not.toMatch(/2026/)
    })

    it('de otro año muestra el año', () => {
        expect(dayLabel('2025-12-31', NOW)).toMatch(/2025/)
    })

    it('ayer funciona al cruzar de mes', () => {
        expect(dayLabel('2026-09-30', new Date(2026, 9, 1, 9))).toBe('Ayer')
    })
})

describe('groupByDay', () => {
    const at = (d: number, h: number) => new Date(2026, 9, d, h).toISOString()

    it('agrupa conservando el orden de llegada', () => {
        const items = [
            { id: 1, at: at(24, 14) },
            { id: 2, at: at(24, 9) },
            { id: 3, at: at(23, 18) }
        ]
        const groups = groupByDay(items, (i) => i.at, NOW)
        expect(groups.map((g) => g.label)).toEqual(['Hoy', 'Ayer'])
        expect(groups[0].items.map((i) => i.id)).toEqual([1, 2])
    })

    it('un día repetido más abajo se une a su grupo', () => {
        const items = [
            { id: 1, at: at(24, 14) },
            { id: 2, at: at(23, 9) },
            { id: 3, at: at(24, 8) }
        ]
        const groups = groupByDay(items, (i) => i.at, NOW)
        expect(groups).toHaveLength(2)
        expect(groups[0].items.map((i) => i.id)).toEqual([1, 3])
    })

    it('lista vacía → sin grupos', () => {
        expect(groupByDay([], () => '', NOW)).toEqual([])
    })

    it('la clave es el día local', () => {
        expect(dayKey(new Date(2026, 9, 24, 23, 59).toISOString())).toBe('2026-10-24')
    })
})

describe('timeLabel', () => {
    it('hora corta en es-CO', () => {
        expect(timeLabel(new Date(2026, 9, 24, 15, 45).toISOString())).toMatch(/3:45/)
    })
})

describe('nextLimit', () => {
    it('avanza de a un paso sin pasarse del total', () => {
        expect(nextLimit(40, 40, 200)).toBe(80)
        expect(nextLimit(180, 40, 200)).toBe(200)
        expect(nextLimit(200, 40, 200)).toBe(200)
    })

    it('tolera valores raros', () => {
        expect(nextLimit(-5, 0, 10)).toBe(1)
        expect(nextLimit(0, 40, 0)).toBe(0)
    })
})

describe('shortDate', () => {
    it('sin año en el año en curso, con año en otro', () => {
        expect(shortDate(new Date(2026, 9, 16, 10).toISOString(), NOW)).toBe('16 oct')
        expect(shortDate(new Date(2025, 4, 27, 10).toISOString(), NOW)).toBe('27 may 2025')
    })
})
