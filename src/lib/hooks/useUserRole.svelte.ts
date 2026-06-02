import { fromStore } from 'svelte/store'
import { useProfile } from '$lib/hooks/useProfile'
import { auth } from '$lib/stores/auth.svelte'

const MANAGER_ROLES = ['owner', 'manager', 'superadmin']

/**
 * Rol del usuario y si puede gestionar (crear/editar). Mientras el rol es
 * desconocido (cold start antes de cargar el perfil) `canManage` es `true`
 * para no ocultar acciones al caso común (owner); al cargar el perfil se ajusta.
 * Debe llamarse durante la inicialización de un componente.
 */
export const useUserRole = () => {
    const profileQuery = fromStore(useProfile())

    return {
        get role(): string | null {
            return profileQuery.current.data?.payload?.user_profile?.type ?? auth.user?.type ?? null
        },
        get canManage(): boolean {
            const role = this.role
            return role === null ? true : MANAGER_ROLES.includes(role)
        },
        /**
         * Solo el owner (y superadmin) puede anular gastos variables. Mientras el
         * rol es desconocido (cold start) devuelve `false` para no exponer la
         * acción destructiva antes de confirmar el rol.
         */
        get canVoid(): boolean {
            const role = this.role
            return role === 'owner' || role === 'superadmin'
        }
    }
}
