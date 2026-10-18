import { describe, expect, it } from 'vitest'
import { describeRemaining, isOutOfCredits, latestCredits, parseCredits } from './credits'
import { parseStreamFrame } from './sse'

/** Espejo de placepos: con 0 consultas se bloquea; un servidor viejo nunca bloquea. */
describe('créditos de Place (PWA)', () => {
    it('parsea los créditos y rechaza basura (null = no bloquea)', () => {
        expect(parseCredits({ daily_limit: 5, used_today: 2, remaining: 3 })).toEqual({
            daily_limit: 5,
            used_today: 2,
            remaining: 3
        })
        expect(parseCredits(undefined)).toBeNull()
        expect(parseCredits({ remaining: -1, daily_limit: 1, used_today: 1 })).toBeNull()
    })

    it('gana la lectura más reciente y bloquea solo con 0', () => {
        const a = { credits: { daily_limit: 5, used_today: 4, remaining: 1 }, at: 1 }
        const b = { credits: { daily_limit: 5, used_today: 5, remaining: 0 }, at: 2 }
        expect(isOutOfCredits(latestCredits(a, b))).toBe(true)
        expect(isOutOfCredits(latestCredits(a, null))).toBe(false)
        expect(isOutOfCredits(latestCredits(null, null))).toBe(false)
        expect(describeRemaining(a.credits)).toBe('Te queda 1 consulta hoy')
    })

    it('evento SSE credits', () => {
        expect(
            parseStreamFrame({
                event: 'credits',
                data: JSON.stringify({ daily_limit: 5, used_today: 5, remaining: 0 })
            })
        ).toEqual({ type: 'credits', credits: { daily_limit: 5, used_today: 5, remaining: 0 } })
    })
})
