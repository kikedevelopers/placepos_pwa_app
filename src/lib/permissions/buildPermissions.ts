import type { UserProfile } from '$lib/api/requests/authentication/types'

export type UserType = 'employee' | 'owner' | 'superadmin'

/**
 * Catálogo de las 22 keys de permiso gestionables (gemelo del catálogo de
 * placepos desktop). `canAccessLicenses` NO forma parte del array gestionable:
 * es un módulo interno que en este cliente web no se expone.
 */
export interface Permissions {
    canAccessDashboard: boolean
    canAccessCustomers: boolean
    canAccessInventory: boolean
    canAccessPackaging: boolean
    canAccessCategories: boolean
    canAccessCarriers: boolean
    canAccessSalesReport: boolean
    canAccessCreditsReport: boolean
    canAccessComparativeReport: boolean
    canAccessDailyClosureReport: boolean
    canAccessCashierReport: boolean
    canAccessClientsReport: boolean
    canViewAllSales: boolean
    canAccessBanks: boolean
    canAccessWallets: boolean
    canAccessExpenses: boolean
    canAccessFixedExpenses: boolean
    canAccessEmployees: boolean
    canAccessSuppliers: boolean
    canAccessSettings: boolean
    canAccessPOS: boolean
    canAccessPurchase: boolean
}

export type PermissionKey = keyof Permissions

export interface ResolvedPermissions extends Permissions {
    userType: UserType | null
    isAdmin: boolean
    /** Predicado genérico: `isAdmin || granted.has(key)`. */
    can: (key: PermissionKey) => boolean
}

/**
 * Construye el objeto de permisos a partir del array de keys efectivas que el
 * backend (pos_api) entrega en `user_profile.permissions`. Es una función pura
 * (espejo de `buildPermissions.ts` del cliente Electron) para poder testearla
 * sin montar el store ni el hook.
 *
 * owner/superadmin tienen acceso total por robustez aunque el backend ya les
 * envíe las 22 keys: el flag `isAdmin` nunca depende del array.
 */
export const buildPermissions = (
    userProfile: Pick<UserProfile, 'type' | 'permissions'> | null
): ResolvedPermissions => {
    const userType = (userProfile?.type as UserType) || null
    const isAdmin = userType === 'owner' || userType === 'superadmin'

    const granted = new Set(userProfile?.permissions ?? [])
    const can = (key: PermissionKey): boolean => isAdmin || granted.has(key)

    return {
        userType,
        isAdmin,
        can,
        canAccessDashboard: can('canAccessDashboard'),
        canAccessCustomers: can('canAccessCustomers'),
        canAccessInventory: can('canAccessInventory'),
        canAccessPackaging: can('canAccessPackaging'),
        canAccessCategories: can('canAccessCategories'),
        canAccessCarriers: can('canAccessCarriers'),
        canAccessSalesReport: can('canAccessSalesReport'),
        canAccessCreditsReport: can('canAccessCreditsReport'),
        canAccessComparativeReport: can('canAccessComparativeReport'),
        canAccessDailyClosureReport: can('canAccessDailyClosureReport'),
        canAccessCashierReport: can('canAccessCashierReport'),
        canAccessClientsReport: can('canAccessClientsReport'),
        canViewAllSales: can('canViewAllSales'),
        canAccessBanks: can('canAccessBanks'),
        canAccessWallets: can('canAccessWallets'),
        canAccessExpenses: can('canAccessExpenses'),
        canAccessFixedExpenses: can('canAccessFixedExpenses'),
        canAccessEmployees: can('canAccessEmployees'),
        canAccessSuppliers: can('canAccessSuppliers'),
        canAccessSettings: can('canAccessSettings'),
        canAccessPOS: can('canAccessPOS'),
        canAccessPurchase: can('canAccessPurchase')
    }
}
