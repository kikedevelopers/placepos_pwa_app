import { describe, it, expect } from 'vitest'
import { computeVirtualRange, chunk, type VirtualRangeInput } from './virtualWindow'

// Base reutilizable: filas de 100px, sin gap ni rellenos, viewport de 500px.
const base: VirtualRangeInput = {
    scrollTop: 0,
    viewportHeight: 500,
    rowHeight: 100,
    gap: 0,
    count: 1000,
    overscan: 0,
    padStart: 0,
    padEnd: 0
}

describe('computeVirtualRange', () => {
    it('en el tope monta solo las filas visibles (viewport/row)', () => {
        const r = computeVirtualRange(base)
        // 500/100 = 5 visibles → índices 0..5 (lastVisible 5 incluido, end exclusivo = 6).
        expect(r.start).toBe(0)
        expect(r.end).toBe(6)
        expect(r.offsetTop).toBe(0)
    })

    it('calcula la altura total con filas y gaps', () => {
        const r = computeVirtualRange({ ...base, count: 10, gap: 10 })
        // 10*100 + 9*10 = 1090
        expect(r.totalHeight).toBe(1090)
    })

    it('incluye padStart y padEnd en la altura total', () => {
        const r = computeVirtualRange({ ...base, count: 10, gap: 0, padStart: 8, padEnd: 112 })
        expect(r.totalHeight).toBe(8 + 1000 + 112)
    })

    it('al hacer scroll desplaza la ventana y el offsetTop', () => {
        const r = computeVirtualRange({ ...base, scrollTop: 1000 })
        // top=1000 → firstVisible=10, lastVisible=15
        expect(r.start).toBe(10)
        expect(r.end).toBe(16)
        expect(r.offsetTop).toBe(1000)
    })

    it('aplica overscan arriba y abajo sin salirse de rango', () => {
        const r = computeVirtualRange({ ...base, scrollTop: 1000, overscan: 3 })
        // start = 10-3 = 7 ; end = 15+1+3 = 19
        expect(r.start).toBe(7)
        expect(r.end).toBe(19)
        expect(r.offsetTop).toBe(700)
    })

    it('el overscan no produce índices negativos cerca del tope', () => {
        const r = computeVirtualRange({ ...base, scrollTop: 50, overscan: 10 })
        expect(r.start).toBe(0)
        expect(r.offsetTop).toBe(0)
    })

    it('no se pasa del final al llegar al fondo', () => {
        const r = computeVirtualRange({ ...base, count: 10, scrollTop: 10_000, overscan: 5 })
        expect(r.end).toBe(10)
        expect(r.start).toBeLessThan(10)
        expect(r.start).toBeGreaterThanOrEqual(0)
    })

    it('descuenta padStart al mapear scroll → índice', () => {
        // Con padStart=8, para ver la fila 0 el scroll efectivo es scrollTop-8.
        const r = computeVirtualRange({ ...base, scrollTop: 8, padStart: 8 })
        expect(r.start).toBe(0)
        expect(r.offsetTop).toBe(8)
    })

    it('respeta el gap al posicionar (step = row + gap)', () => {
        const r = computeVirtualRange({ ...base, gap: 20, scrollTop: 600 })
        // step=120 ; top=600 → firstVisible=5 ; offsetTop=5*120=600
        expect(r.start).toBe(5)
        expect(r.offsetTop).toBe(600)
    })

    it('lista vacía: nada que montar, altura solo rellenos', () => {
        const r = computeVirtualRange({ ...base, count: 0, padStart: 8, padEnd: 20 })
        expect(r).toEqual({ start: 0, end: 0, offsetTop: 8, totalHeight: 28 })
    })

    it('rowHeight 0 o viewport 0: monta todo (fallback seguro, sin dividir por 0)', () => {
        const allByRow = computeVirtualRange({ ...base, count: 30, rowHeight: 0, gap: 0 })
        expect(allByRow).toMatchObject({ start: 0, end: 30 })
        const allByViewport = computeVirtualRange({ ...base, count: 30, viewportHeight: 0 })
        expect(allByViewport).toMatchObject({ start: 0, end: 30 })
    })

    it('todas las filas caben en el viewport: monta todas', () => {
        const r = computeVirtualRange({ ...base, count: 3, viewportHeight: 500 })
        expect(r.start).toBe(0)
        expect(r.end).toBe(3)
    })
})

describe('chunk', () => {
    it('parte en filas de N', () => {
        expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
    })

    it('size 1 → una fila por elemento', () => {
        expect(chunk([1, 2, 3], 1)).toEqual([[1], [2], [3]])
    })

    it('fila final incompleta', () => {
        expect(chunk([1, 2, 3, 4], 3)).toEqual([[1, 2, 3], [4]])
    })

    it('lista vacía → sin filas', () => {
        expect(chunk([], 4)).toEqual([])
    })

    it('size 4 exacto', () => {
        expect(chunk([1, 2, 3, 4, 5, 6, 7, 8], 4)).toEqual([
            [1, 2, 3, 4],
            [5, 6, 7, 8]
        ])
    })
})
