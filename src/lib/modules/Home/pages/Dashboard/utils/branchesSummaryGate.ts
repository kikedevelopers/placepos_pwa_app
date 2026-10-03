import type { CompanyProfile } from '$lib/api/requests/authentication/types'

/** Sucursales (is_branch) actualmente ACTIVAS del owner. */
export const countActiveBranches = (companies: CompanyProfile[]): number =>
    companies.filter((c) => c.is_branch && c.is_active).length

export type BranchesSummaryGateParams = {
    userType: string | null | undefined
    branchesEnabled: boolean
    companies: CompanyProfile[]
}

/**
 * El resumen consolidado por sucursal se muestra solo cuando el usuario es OWNER
 * (el endpoint `GET /dashboard/branches-summary` es owner-only), tiene las
 * sucursales habilitadas y existe AL MENOS una sucursal activa. La PWA es
 * cloud-only, así que no hay flag de modo que verificar.
 */
export const shouldShowBranchesSummary = ({
    userType,
    branchesEnabled,
    companies
}: BranchesSummaryGateParams): boolean =>
    userType === 'owner' && branchesEnabled && countActiveBranches(companies) >= 1
