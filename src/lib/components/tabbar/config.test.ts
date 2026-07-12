import { describe, expect, it } from 'vitest'
import { buildPermissions } from '$lib/permissions/buildPermissions'
import { filterTabs } from './config'

const tabRoutes = (tabs: { route: string }[]) => tabs.map((t) => t.route)

describe('filterTabs', () => {
    it('owner ve todas las tabs y el POS central', () => {
        const can = buildPermissions({ type: 'owner', permissions: [] }).can
        const v = filterTabs(can)
        expect(tabRoutes(v.left)).toEqual(['/', '/reportes'])
        expect(tabRoutes(v.right)).toEqual(['/inventario', '/gastos'])
        expect(v.showPos).toBe(true)
    })

    it('Vendedor (POS + Ventas): sólo Reportes y POS central, sin las demás', () => {
        const can = buildPermissions({
            type: 'employee',
            permissions: ['canAccessPOS', 'canAccessSalesReport']
        }).can
        const v = filterTabs(can)
        expect(tabRoutes(v.left)).toEqual(['/reportes'])
        expect(tabRoutes(v.right)).toEqual([])
        expect(v.showPos).toBe(true)
    })

    it('Cajero: Inicio+Reportes a la izq, Inventario+Gastos a la der, POS central', () => {
        const can = buildPermissions({
            type: 'employee',
            permissions: [
                'canAccessDashboard',
                'canAccessSalesReport',
                'canAccessInventory',
                'canAccessExpenses',
                'canAccessPOS'
            ]
        }).can
        const v = filterTabs(can)
        expect(tabRoutes(v.left)).toEqual(['/', '/reportes'])
        expect(tabRoutes(v.right)).toEqual(['/inventario', '/gastos'])
        expect(v.showPos).toBe(true)
    })

    it('empleado sin canAccessPOS: no se resalta el POS central', () => {
        const can = buildPermissions({
            type: 'employee',
            permissions: ['canAccessSalesReport']
        }).can
        const v = filterTabs(can)
        expect(v.showPos).toBe(false)
        expect(tabRoutes(v.left)).toEqual(['/reportes'])
        expect(tabRoutes(v.right)).toEqual([])
    })

    it('empleado sin permisos: barra vacía', () => {
        const can = buildPermissions({ type: 'employee', permissions: [] }).can
        const v = filterTabs(can)
        expect(v.left).toEqual([])
        expect(v.right).toEqual([])
        expect(v.showPos).toBe(false)
    })

    it('Reportes visible con CUALQUIER key de informe (solo Cajeros)', () => {
        const can = buildPermissions({
            type: 'employee',
            permissions: ['canAccessCashierReport']
        }).can
        const v = filterTabs(can)
        expect(tabRoutes(v.left)).toEqual(['/reportes'])
    })

    it('Reportes oculto si no tiene ninguna key de informe (solo POS)', () => {
        const can = buildPermissions({ type: 'employee', permissions: ['canAccessPOS'] }).can
        const v = filterTabs(can)
        expect(tabRoutes(v.left)).toEqual([])
        expect(v.showPos).toBe(true)
    })
})
