import { describe, expect, it } from 'vitest'
import { buildPermissions } from './buildPermissions'

// Sets de roles de fábrica equivalentes a los del módulo de roles (pos_api).
const VENDEDOR = ['canAccessPOS', 'canAccessSalesReport']
const CAJERO = [
    'canAccessPOS',
    'canAccessSalesReport',
    'canAccessInventory',
    'canAccessExpenses',
    'canAccessDashboard'
]

describe('buildPermissions', () => {
    it('Vendedor: ve POS y Ventas, NO ve inventario ni gastos fijos', () => {
        const p = buildPermissions({ type: 'employee', permissions: VENDEDOR })
        expect(p.userType).toBe('employee')
        expect(p.isAdmin).toBe(false)
        expect(p.canAccessPOS).toBe(true)
        expect(p.canAccessSalesReport).toBe(true)
        expect(p.canAccessInventory).toBe(false)
        expect(p.canAccessExpenses).toBe(false)
        expect(p.canAccessFixedExpenses).toBe(false)
    })

    it('Cajero: ve inventario y gastos (variables) pero NO gastos fijos', () => {
        const p = buildPermissions({ type: 'employee', permissions: CAJERO })
        expect(p.isAdmin).toBe(false)
        expect(p.canAccessInventory).toBe(true)
        expect(p.canAccessExpenses).toBe(true)
        expect(p.canAccessFixedExpenses).toBe(false)
        expect(p.canAccessPOS).toBe(true)
    })

    it('owner: acceso total aunque el array venga vacío', () => {
        const p = buildPermissions({ type: 'owner', permissions: [] })
        expect(p.isAdmin).toBe(true)
        expect(p.canAccessDashboard).toBe(true)
        expect(p.canAccessFixedExpenses).toBe(true)
        expect(p.canAccessInventory).toBe(true)
        expect(p.canAccessPOS).toBe(true)
        expect(p.can('canAccessSuppliers')).toBe(true)
    })

    it('owner: acceso total aunque permissions sea undefined', () => {
        const p = buildPermissions({ type: 'owner' })
        expect(p.isAdmin).toBe(true)
        expect(p.canAccessFixedExpenses).toBe(true)
    })

    it('superadmin: acceso total', () => {
        const p = buildPermissions({ type: 'superadmin', permissions: [] })
        expect(p.isAdmin).toBe(true)
        expect(p.can('canAccessSettings')).toBe(true)
    })

    it('perfil null: sin tipo, sin permisos', () => {
        const p = buildPermissions(null)
        expect(p.userType).toBe(null)
        expect(p.isAdmin).toBe(false)
        expect(p.canAccessDashboard).toBe(false)
        expect(p.can('canAccessPOS')).toBe(false)
    })

    it('empleado sin array de permisos: no tiene acceso a nada', () => {
        const p = buildPermissions({ type: 'employee' })
        expect(p.isAdmin).toBe(false)
        expect(p.canAccessPOS).toBe(false)
        expect(p.canAccessSalesReport).toBe(false)
    })
})
