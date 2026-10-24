import type { PermissionKey } from '$lib/permissions/buildPermissions'

/**
 * Pestañas de Reportes con los MISMOS nombres y permisos que el grupo
 * "Informes" de placepos (Ventas · Cartera · Comparativa · Resumen · Cajeros ·
 * Clientes). Cada una se muestra solo si el usuario tiene su permiso.
 */
export type ReportTabId = 'sales' | 'credits' | 'comparative' | 'summary' | 'cashiers' | 'customers'

export interface ReportTab {
    id: ReportTabId
    label: string
    permission: PermissionKey
}

export const REPORT_TABS: readonly ReportTab[] = [
    { id: 'sales', label: 'Ventas', permission: 'canAccessSalesReport' },
    { id: 'credits', label: 'Cartera', permission: 'canAccessCreditsReport' },
    { id: 'comparative', label: 'Comparativa', permission: 'canAccessComparativeReport' },
    { id: 'summary', label: 'Resumen', permission: 'canAccessDailyClosureReport' },
    { id: 'cashiers', label: 'Cajeros', permission: 'canAccessCashierReport' },
    { id: 'customers', label: 'Clientes', permission: 'canAccessClientsReport' }
]

/** Pestañas visibles para quien tiene estos permisos (orden de placepos). */
export const visibleReportTabs = (can: (key: PermissionKey) => boolean): ReportTab[] =>
    REPORT_TABS.filter((tab) => can(tab.permission))

/**
 * Pestaña activa a partir del parámetro de la URL: si no existe o el usuario no
 * puede verla, cae a la primera visible (null si no ve ninguna).
 */
export const resolveReportTab = (
    requested: string | null | undefined,
    visible: readonly ReportTab[]
): ReportTabId | null => {
    const match = visible.find((tab) => tab.id === requested)
    return (match ?? visible[0])?.id ?? null
}
