import { describe, expect, it } from 'vitest'
import { formatCurrency } from '$lib/utils/numbers'
import { percent, plural, signedPercent, splitMoney, trendOf } from './format'

describe('splitMoney', () => {
    it('parte símbolo, entero y decimales con el formato es-CO', () => {
        expect(splitMoney(6450)).toEqual({ negative: false, symbol: '$', integer: '6.450', fraction: '' })
        expect(splitMoney(4033846.08)).toEqual({
            negative: false,
            symbol: '$',
            integer: '4.033.846',
            fraction: ',08'
        })
    })

    it('los negativos llevan la marca aparte (el entero va sin signo)', () => {
        const parts = splitMoney(-1500)
        expect(parts.negative).toBe(true)
        expect(parts.integer).toBe('1.500')
    })

    it('cero, null, undefined y NaN se muestran como $ 0 sin signo', () => {
        for (const v of [0, null, undefined, Number.NaN, -0]) {
            const parts = splitMoney(v)
            expect(parts.integer).toBe('0')
            expect(parts.negative).toBe(false)
        }
    })

    it('reconstruye exactamente lo que muestra formatCurrency', () => {
        for (const v of [1, 999, 1000, 26100000.5, 168076.92]) {
            const p = splitMoney(v)
            const rebuilt = `${p.symbol} ${p.integer}${p.fraction}`
            expect(rebuilt).toBe(formatCurrency(v).replace(/ /g, ' '))
        }
    })

    it('respeta los decimales pedidos', () => {
        expect(splitMoney(10.567, 0).fraction).toBe('')
        expect(splitMoney(10.567, 1).fraction).toBe(',6')
    })
})

describe('trendOf', () => {
    it('sube, baja o se queda plano', () => {
        expect(trendOf(3)).toBe('up')
        expect(trendOf(-0.2)).toBe('down')
        expect(trendOf(0)).toBe('flat')
    })

    it('el ruido de redondeo y los valores ausentes cuentan como plano', () => {
        expect(trendOf(0.001)).toBe('flat')
        expect(trendOf(null)).toBe('flat')
        expect(trendOf(undefined)).toBe('flat')
        expect(trendOf(Number.POSITIVE_INFINITY)).toBe('flat')
    })
})

describe('signedPercent / percent', () => {
    it('lleva signo explícito con 1 decimal', () => {
        expect(signedPercent(12.46)).toBe('+12,5 %')
        expect(signedPercent(-3)).toBe('−3,0 %')
        expect(signedPercent(0)).toBe('0,0 %')
    })

    it('sin dato devuelve una raya', () => {
        expect(signedPercent(null)).toBe('—')
        expect(signedPercent(Number.NaN)).toBe('—')
    })

    it('percent no lleva signo y tolera basura', () => {
        expect(percent(25)).toBe('25,0 %')
        expect(percent(Number.NaN)).toBe('0,0 %')
    })
})

describe('plural', () => {
    it('singular solo con 1', () => {
        expect(plural(1, 'venta')).toBe('1 venta')
        expect(plural(0, 'venta')).toBe('0 ventas')
        expect(plural(1200, 'venta')).toBe('1.200 ventas')
    })

    it('acepta plural irregular', () => {
        expect(plural(2, 'crédito vigente', 'créditos vigentes')).toBe('2 créditos vigentes')
    })
})
