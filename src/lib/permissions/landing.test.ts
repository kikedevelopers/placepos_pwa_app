import { describe, it, expect } from 'vitest'
import { resolveLanding, shouldGateAppShell, SALES_REPORT_PATH } from './landing'

describe('resolveLanding (espejo de useEmployeeRedirect de placepos)', () => {
    it('empleado en / → redirige al informe de ventas', () => {
        expect(resolveLanding('employee', '/')).toBe(SALES_REPORT_PATH)
    })

    it('empleado fuera de / → NO redirige (solo actúa en el dashboard)', () => {
        expect(resolveLanding('employee', '/reportes')).toBeNull()
        expect(resolveLanding('employee', '/inventario')).toBeNull()
        expect(resolveLanding('employee', '/pos')).toBeNull()
    })

    it('owner/superadmin en / → NO redirige (se quedan en el dashboard)', () => {
        expect(resolveLanding('owner', '/')).toBeNull()
        expect(resolveLanding('superadmin', '/')).toBeNull()
    })

    it('tipo aún no resuelto (null/undefined) → NO redirige', () => {
        expect(resolveLanding(null, '/')).toBeNull()
        expect(resolveLanding(undefined, '/')).toBeNull()
    })
})

describe('shouldGateAppShell (anti-parpadeo, espejo del loader de placepos)', () => {
    it('perfil aún cargando → SIEMPRE gate (splash), sea quien sea', () => {
        expect(shouldGateAppShell({ profileSettled: false, type: undefined, pathname: '/' })).toBe(
            true
        )
        expect(shouldGateAppShell({ profileSettled: false, type: 'owner', pathname: '/' })).toBe(
            true
        )
        expect(
            shouldGateAppShell({ profileSettled: false, type: 'employee', pathname: '/reportes' })
        ).toBe(true)
    })

    it('perfil resuelto + empleado en / → gate hasta completar la redirección', () => {
        expect(shouldGateAppShell({ profileSettled: true, type: 'employee', pathname: '/' })).toBe(
            true
        )
    })

    it('perfil resuelto + empleado ya en el informe de ventas → pinta', () => {
        expect(
            shouldGateAppShell({ profileSettled: true, type: 'employee', pathname: '/reportes' })
        ).toBe(false)
    })

    it('perfil resuelto + owner en el dashboard → pinta (sin redirección)', () => {
        expect(shouldGateAppShell({ profileSettled: true, type: 'owner', pathname: '/' })).toBe(
            false
        )
    })

    it('perfil resuelto + empleado en otra ruta → pinta (sin bloqueo por ruta, igual que placepos)', () => {
        expect(
            shouldGateAppShell({ profileSettled: true, type: 'employee', pathname: '/inventario' })
        ).toBe(false)
    })
})
