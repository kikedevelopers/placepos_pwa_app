import { describe, expect, it } from 'vitest'
import type { PermissionKey } from '$lib/permissions/buildPermissions'
import { REPORT_TABS, resolveReportTab, visibleReportTabs } from './reportTabs'

const only = (...keys: PermissionKey[]) => (key: PermissionKey) => keys.includes(key)

describe('pestañas de Reportes', () => {
    it('usan los nombres y el orden de placepos', () => {
        expect(REPORT_TABS.map((t) => t.label)).toEqual([
            'Ventas',
            'Cartera',
            'Comparativa',
            'Resumen',
            'Cajeros',
            'Clientes'
        ])
    })

    it('ya no existen "Ventas y Créditos" ni "Finanzas"', () => {
        const labels = REPORT_TABS.map((t) => t.label)
        expect(labels).not.toContain('Ventas y Créditos')
        expect(labels).not.toContain('Finanzas')
    })

    it('cada pestaña se gatea por su propio permiso', () => {
        expect(visibleReportTabs(() => true)).toHaveLength(6)
        expect(visibleReportTabs(only('canAccessSalesReport')).map((t) => t.id)).toEqual(['sales'])
        expect(visibleReportTabs(only('canAccessCreditsReport')).map((t) => t.id)).toEqual(['credits'])
        expect(visibleReportTabs(only('canAccessDailyClosureReport')).map((t) => t.id)).toEqual(['summary'])
        expect(visibleReportTabs(() => false)).toEqual([])
    })
})

describe('pestaña Agente (pedidos del agente de ventas)', () => {
    it('solo con el agente habilitado para el usuario; va al final', () => {
        expect(visibleReportTabs(() => true).map((t) => t.id)).not.toContain('agente')
        const tabs = visibleReportTabs(() => true, { agentOrders: true })
        expect(tabs.at(-1)).toEqual({ id: 'agente', label: 'Agente' })
    })

    it('no depende de los permisos de informes', () => {
        expect(visibleReportTabs(() => false, { agentOrders: true }).map((t) => t.id)).toEqual(['agente'])
    })

    it('se puede abrir por URL (?tab=agente) solo si está visible', () => {
        expect(resolveReportTab('agente', visibleReportTabs(() => true, { agentOrders: true }))).toBe('agente')
        expect(resolveReportTab('agente', visibleReportTabs(() => true))).toBe('sales')
    })
})

describe('resolveReportTab', () => {
    const all = visibleReportTabs(() => true)

    it('respeta la pestaña pedida en la URL', () => {
        expect(resolveReportTab('summary', all)).toBe('summary')
    })

    it('sin parámetro o con uno desconocido cae a la primera visible', () => {
        expect(resolveReportTab(null, all)).toBe('sales')
        expect(resolveReportTab('finance', all)).toBe('sales')
    })

    it('una pestaña sin permiso no se abre aunque venga en la URL', () => {
        const visible = visibleReportTabs(only('canAccessCreditsReport', 'canAccessCashierReport'))
        expect(resolveReportTab('sales', visible)).toBe('credits')
        expect(resolveReportTab('cashiers', visible)).toBe('cashiers')
    })

    it('sin pestañas visibles devuelve null', () => {
        expect(resolveReportTab('sales', [])).toBeNull()
    })
})
