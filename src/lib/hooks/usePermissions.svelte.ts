import { fromStore } from 'svelte/store'
import { useProfile } from '$lib/hooks/useProfile'
import { auth } from '$lib/stores/auth.svelte'
import {
    buildPermissions,
    type PermissionKey,
    type ResolvedPermissions
} from '$lib/permissions/buildPermissions'

/**
 * Permisos efectivos del usuario (espejo de `usePermissions`/`buildPermissions`
 * del cliente Electron). Consume el `user_profile` del store de perfil y expone
 * los booleanos por key + `can(key)` genérico + `isAdmin`/`userType`.
 *
 * Reactivo: leer cualquier getter dentro de un componente/efecto se recomputa
 * cuando llega el perfil. Debe llamarse durante la inicialización de un
 * componente (igual que `useUserRole`/`useProfile`).
 */
export const usePermissions = () => {
    const profileQuery = fromStore(useProfile())

    const resolved = (): ResolvedPermissions => {
        const profile = profileQuery.current.data?.payload?.user_profile
        // Fallback al `auth.user` para conocer el tipo durante el cold start
        // (antes de que el perfil resuelva). `permissions` sólo viene del perfil.
        const type = profile?.type ?? auth.user?.type
        return buildPermissions(
            type ? { type, permissions: profile?.permissions } : null
        )
    }

    return {
        get userType() {
            return resolved().userType
        },
        get isAdmin(): boolean {
            return resolved().isAdmin
        },
        /** Predicado genérico por key del catálogo. */
        can(key: PermissionKey): boolean {
            return resolved().can(key)
        },
        get canAccessDashboard(): boolean {
            return resolved().canAccessDashboard
        },
        get canAccessPOS(): boolean {
            return resolved().canAccessPOS
        },
        get canAccessInventory(): boolean {
            return resolved().canAccessInventory
        },
        get canAccessExpenses(): boolean {
            return resolved().canAccessExpenses
        },
        get canAccessFixedExpenses(): boolean {
            return resolved().canAccessFixedExpenses
        },
        get canAccessSalesReport(): boolean {
            return resolved().canAccessSalesReport
        }
    }
}
