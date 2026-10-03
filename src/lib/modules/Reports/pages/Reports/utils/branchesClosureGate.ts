import type { CompanyProfile } from '$lib/api/requests/authentication/types'

/** Sucursales (is_branch) actualmente ACTIVAS. */
export const countActiveBranches = (companies: CompanyProfile[]): number =>
    companies.filter((c) => c.is_branch && c.is_active).length

export type BranchesClosureGateParams = {
    isAdminLevel: boolean
    /** `company_profile.primary.is_branch` (undefined mientras carga el perfil). */
    primaryIsBranch: boolean | undefined
    branchesEnabled: boolean
    companies: CompanyProfile[]
}

/**
 * La pestaña "Sucursales" (reemplaza al "Extendido") se muestra solo cuando el
 * usuario es NIVEL ADMIN (owner/superadmin o empleado con rol Administrador),
 * está en el NEGOCIO PRINCIPAL (no en una sucursal), tiene sucursales
 * habilitadas y ≥1 activa. La PWA es cloud-only. El endpoint
 * `GET /reports/branches-daily-closure` es owner/admin + principal-only.
 */
export const shouldShowBranchesClosure = ({
    isAdminLevel,
    primaryIsBranch,
    branchesEnabled,
    companies
}: BranchesClosureGateParams): boolean =>
    isAdminLevel &&
    primaryIsBranch === false &&
    branchesEnabled &&
    countActiveBranches(companies) >= 1
