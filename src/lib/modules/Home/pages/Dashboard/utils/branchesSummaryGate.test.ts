import { describe, expect, it } from 'vitest'
import type { CompanyProfile } from '$lib/api/requests/authentication/types'
import { countActiveBranches, shouldShowBranchesSummary } from './branchesSummaryGate'

const company = (partial: Partial<CompanyProfile>): CompanyProfile =>
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
        ...partial
    }) as CompanyProfile

const principal = company({ id: 1, is_branch: false, is_active: true })
const branchActive = company({ id: 2, is_branch: true, is_active: true })
const branchSuspended = company({ id: 3, is_branch: true, is_active: false })

describe('countActiveBranches', () => {
    it('cuenta solo sucursales activas, ignora el principal', () => {
        expect(countActiveBranches([principal, branchActive, branchSuspended])).toBe(1)
    })

    it('es 0 sin sucursales activas', () => {
        expect(countActiveBranches([principal, branchSuspended])).toBe(0)
        expect(countActiveBranches([])).toBe(0)
    })
})

describe('shouldShowBranchesSummary', () => {
    const base = {
        userType: 'owner',
        branchesEnabled: true,
        companies: [principal, branchActive]
    }

    it('se muestra para owner con sucursales habilitadas y ≥1 activa', () => {
        expect(shouldShowBranchesSummary(base)).toBe(true)
    })

    it('NO se muestra si el usuario no es owner (endpoint owner-only)', () => {
        expect(shouldShowBranchesSummary({ ...base, userType: 'employee' })).toBe(false)
        expect(shouldShowBranchesSummary({ ...base, userType: 'manager' })).toBe(false)
        expect(shouldShowBranchesSummary({ ...base, userType: 'superadmin' })).toBe(false)
        expect(shouldShowBranchesSummary({ ...base, userType: null })).toBe(false)
        expect(shouldShowBranchesSummary({ ...base, userType: undefined })).toBe(false)
    })

    it('NO se muestra si las sucursales no están habilitadas', () => {
        expect(shouldShowBranchesSummary({ ...base, branchesEnabled: false })).toBe(false)
    })

    it('NO se muestra sin al menos una sucursal activa', () => {
        expect(
            shouldShowBranchesSummary({ ...base, companies: [principal, branchSuspended] })
        ).toBe(false)
        expect(shouldShowBranchesSummary({ ...base, companies: [principal] })).toBe(false)
    })
})
