import { describe, expect, it } from 'vitest'
import type { CompanyProfile } from '$lib/api/requests/authentication/types'
import { countActiveBranches, shouldShowBranchesClosure } from './branchesClosureGate'

const company = (p: Partial<CompanyProfile>): CompanyProfile =>
    ({
        id: 1,
        name: 'X',
        is_branch: false,
        balance: 0,
        document_number: null,
        address: null,
        email: null,
        phone_number: null,
        created_at: '',
        updated_at: '',
        is_active: true,
        ...p
    }) as CompanyProfile

const principal = company({ id: 1, is_branch: false, is_active: true })
const branchActive = company({ id: 2, is_branch: true, is_active: true })
const branchSuspended = company({ id: 3, is_branch: true, is_active: false })

describe('countActiveBranches', () => {
    it('cuenta solo sucursales activas', () => {
        expect(countActiveBranches([principal, branchActive, branchSuspended])).toBe(1)
        expect(countActiveBranches([principal])).toBe(0)
    })
})

describe('shouldShowBranchesClosure', () => {
    const base = {
        isAdminLevel: true,
        primaryIsBranch: false,
        branchesEnabled: true,
        companies: [principal, branchActive]
    }

    it('se muestra para admin en el principal con ≥1 sucursal activa', () => {
        expect(shouldShowBranchesClosure(base)).toBe(true)
    })

    it('NO se muestra si no es admin-level', () => {
        expect(shouldShowBranchesClosure({ ...base, isAdminLevel: false })).toBe(false)
    })

    it('NO se muestra desde una sucursal ni si el perfil no cargó', () => {
        expect(shouldShowBranchesClosure({ ...base, primaryIsBranch: true })).toBe(false)
        expect(shouldShowBranchesClosure({ ...base, primaryIsBranch: undefined })).toBe(false)
    })

    it('NO se muestra sin sucursales habilitadas', () => {
        expect(shouldShowBranchesClosure({ ...base, branchesEnabled: false })).toBe(false)
    })

    it('NO se muestra sin al menos una sucursal activa', () => {
        expect(
            shouldShowBranchesClosure({ ...base, companies: [principal, branchSuspended] })
        ).toBe(false)
    })
})
