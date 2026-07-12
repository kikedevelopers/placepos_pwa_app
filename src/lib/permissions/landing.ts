/**
 * Lógica de "landing" tras la primera carga (RBAC), espejo de
 * `useEmployeeRedirect` del cliente desktop placepos
 * (`template/Dashboard/hooks/useEmployeeRedirect.ts`).
 *
 * Regla: un usuario que NO es owner (es decir, `type === 'employee'`) que cae en
 * el dashboard por defecto (`/`) es redirigido al informe de Ventas (`/reportes`,
 * que abre por defecto el reporte de ventas / primer informe permitido).
 * owner/superadmin se quedan en el dashboard. La condición es puramente por
 * `type` (igual que placepos), no por `canAccessDashboard`.
 */

export type UserTypeLike = string | null | undefined

/** Ruta del informe de ventas (landing del empleado). */
export const SALES_REPORT_PATH = '/reportes'

/** Ruta del dashboard/home (landing del owner). */
export const DASHBOARD_PATH = '/'

/**
 * Destino de redirección para la primera carga, o `null` si el usuario se queda
 * donde está. Solo actúa cuando el empleado cae exactamente en el dashboard (`/`),
 * igual que placepos actúa solo en `pathname === '/dashboard'`.
 */
export function resolveLanding(type: UserTypeLike, pathname: string): string | null {
    if (type === 'employee' && pathname === DASHBOARD_PATH) {
        return SALES_REPORT_PATH
    }
    return null
}

/**
 * ¿Debe mostrarse el splash en lugar del app-shell? True mientras (a) el perfil
 * (rol + permisos) aún no resolvió, o (b) un empleado en `/` todavía se está
 * redirigiendo al informe de ventas. Evita que el empleado vea el dashboard o
 * dispare sus queries antes de resolver el rol (espejo del loader "Cargando
 * perfil…" de placepos).
 */
export function shouldGateAppShell(opts: {
    profileSettled: boolean
    type: UserTypeLike
    pathname: string
}): boolean {
    if (!opts.profileSettled) {
        return true
    }
    return resolveLanding(opts.type, opts.pathname) !== null
}
