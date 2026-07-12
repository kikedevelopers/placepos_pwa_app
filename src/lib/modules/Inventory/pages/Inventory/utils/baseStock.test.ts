import { describe, expect, it } from 'vitest'
import { toPackageStock, toMinimalStock, repackageStock } from './baseStock'

// El stock del base se PERSISTE en unidad mínima pero se DIGITA/MUESTRA en unidad
// de empaque. minimal = paquetes × packaging_value. Paridad con placepos.
describe('toMinimalStock (empaque -> unidad mínima, lo que se guarda)', () => {
    it('multiplica los paquetes por el packaging_value', () => {
        expect(toMinimalStock(10, 12)).toBe(120) // Trisalsina: 10 paq x12
        expect(toMinimalStock(3, 10000)).toBe(30000) // uva pasa: 3 cajas x10000
    })

    it('empaque x1 / sin empaque (null/0/negativo) => guarda tal cual', () => {
        expect(toMinimalStock(42, 1)).toBe(42)
        expect(toMinimalStock(42, null)).toBe(42)
        expect(toMinimalStock(42, 0)).toBe(42)
        expect(toMinimalStock(42, -5)).toBe(42)
    })

    it('paquetes fraccionarios se convierten con precisión', () => {
        expect(toMinimalStock(2.5, 12)).toBe(30)
        expect(toMinimalStock(0, 12)).toBe(0)
    })
})

describe('toPackageStock (unidad mínima -> empaque, lo que se muestra al cargar)', () => {
    it('divide el stock persistido por el packaging_value', () => {
        expect(toPackageStock(120, 12)).toBe(10)
        expect(toPackageStock(30000, 10000)).toBe(3)
    })

    it('empaque x1 / sin empaque => muestra tal cual', () => {
        expect(toPackageStock(42, 1)).toBe(42)
        expect(toPackageStock(42, null)).toBe(42)
    })

    it('división no exacta se redondea a 4 decimales (bug original 10/12)', () => {
        expect(toPackageStock(10, 12)).toBe(0.8333)
    })
})

describe('repackageStock (cambiar empaque en edición preserva el stock físico)', () => {
    it('mantiene la unidad mínima constante al cambiar de x12 a x24', () => {
        const nuevos = repackageStock(10, 12, 24)
        expect(nuevos).toBe(5)
        expect(toMinimalStock(nuevos, 24)).toBe(120)
    })

    it('de x1 a x12 reagrupa sin cambiar las unidades reales', () => {
        expect(repackageStock(120, 1, 12)).toBe(10)
    })

    it('quitar el empaque (a x1) expande a la unidad mínima', () => {
        expect(repackageStock(3, 10000, 1)).toBe(30000)
    })

    it('preserva la unidad mínima aunque el reparto quede fraccionario', () => {
        const minimalAntes = toMinimalStock(7, 500)
        const nuevos = repackageStock(7, 500, 250)
        expect(toMinimalStock(nuevos, 250)).toBe(minimalAntes)
    })
})

describe('round-trip empaque <-> unidad mínima (coherencia del formulario)', () => {
    it('guardar y volver a cargar preserva los paquetes digitados', () => {
        const casos: Array<[number, number]> = [
            [10, 12],
            [3, 10000],
            [60, 500],
            [42, 1],
            [7, 24]
        ]
        for (const [paquetes, value] of casos) {
            expect(toPackageStock(toMinimalStock(paquetes, value), value)).toBe(paquetes)
        }
    })
})
