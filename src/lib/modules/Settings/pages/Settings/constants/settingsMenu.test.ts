import { describe, expect, it } from 'vitest'
import { SETTINGS_GROUPS, visibleSettingsGroups } from './settingsMenu'

describe('menú de Configuración', () => {
    it('el dueño ve todo, agrupado', () => {
        const groups = visibleSettingsGroups(true)
        expect(groups.map((g) => g.title)).toEqual(['Cuenta', 'Negocio', 'Apariencia'])
        expect(groups.flatMap((g) => g.entries.map((e) => e.view))).toEqual(['account', 'business', 'pos', 'alerts', 'theme'])
    })

    it('un empleado no ve "Mi cuenta" y el grupo vacío desaparece', () => {
        const groups = visibleSettingsGroups(false)
        expect(groups.map((g) => g.title)).toEqual(['Negocio', 'Apariencia'])
        expect(groups.flatMap((g) => g.entries.map((e) => e.view))).not.toContain('account')
    })

    it('no muta la configuración base', () => {
        visibleSettingsGroups(false)
        expect(SETTINGS_GROUPS[0].entries).toHaveLength(1)
    })

    it('cada entrada tiene color sólido y detalle', () => {
        for (const e of SETTINGS_GROUPS.flatMap((g) => g.entries)) {
            expect(e.color).toMatch(/^#[0-9a-f]{6}$/)
            expect(e.detail.length).toBeGreaterThan(0)
        }
    })
})
