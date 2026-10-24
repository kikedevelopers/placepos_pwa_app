import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { QUICK_ACTIONS } from './quickActions'

const ROUTES = resolve(__dirname, '..', '..', '..', '..', '..', 'routes', '(app)')

describe('accesos rápidos del Inicio', () => {
    it('el Catálogo ya no existe (ni acceso ni ruta ni módulo)', () => {
        expect(QUICK_ACTIONS.map((a) => a.route)).not.toContain('/catalogo')
        expect(QUICK_ACTIONS.map((a) => a.label)).not.toContain('Catálogo')
        expect(existsSync(resolve(ROUTES, 'catalogo'))).toBe(false)
        expect(existsSync(resolve(__dirname, '..', '..', '..', 'Catalog'))).toBe(false)
    })

    it('seis accesos (grilla 3 × 2) y cada uno apunta a una ruta que existe', () => {
        expect(QUICK_ACTIONS).toHaveLength(6)
        for (const action of QUICK_ACTIONS) {
            expect(existsSync(resolve(ROUTES, action.route.slice(1), '+page.svelte'))).toBe(true)
        }
    })

    it('rutas y etiquetas únicas', () => {
        expect(new Set(QUICK_ACTIONS.map((a) => a.route)).size).toBe(QUICK_ACTIONS.length)
        expect(new Set(QUICK_ACTIONS.map((a) => a.label)).size).toBe(QUICK_ACTIONS.length)
    })
})
