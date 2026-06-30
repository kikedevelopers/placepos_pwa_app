import { BarChart3, Boxes, Home, Receipt, ShoppingCart } from '@lucide/svelte'
import type { IconComponent } from '$lib/types/icon'
import type { PermissionKey } from '$lib/permissions/buildPermissions'

export type Tab = {
    route: string
    match: string
    label: string
    icon: IconComponent
    permission: PermissionKey
}

// El POS va resaltado en el centro; los demás son pestañas normales (2 a cada lado).
// Cada tab declara la key de permiso (RBAC) que la habilita.
export const LEFT_TABS: Tab[] = [
    { route: '/', match: '/', label: 'Inicio', icon: Home, permission: 'canAccessDashboard' },
    {
        route: '/reportes',
        match: '/reportes',
        label: 'Reportes',
        icon: BarChart3,
        permission: 'canAccessSalesReport'
    }
]
export const RIGHT_TABS: Tab[] = [
    {
        route: '/inventario',
        match: '/inventario',
        label: 'Inventario',
        icon: Boxes,
        permission: 'canAccessInventory'
    },
    {
        route: '/gastos',
        match: '/gastos',
        label: 'Gastos',
        icon: Receipt,
        permission: 'canAccessExpenses'
    }
]
export const POS_TAB: Tab = {
    route: '/pos',
    match: '/pos',
    label: 'POS',
    icon: ShoppingCart,
    permission: 'canAccessPOS'
}

export const ACTIVE = 'hsl(217, 91%, 50%)'
export const INACTIVE = 'hsl(215, 16%, 47%)'

export type VisibleTabs = {
    left: Tab[]
    right: Tab[]
    showPos: boolean
}

/**
 * Filtra las tabs según los permisos del usuario. Función pura (testable sin
 * montar el componente): conserva el orden y el reparto izquierda/POS/derecha,
 * ocultando las que no tengan permiso. owner/superadmin (cuyo `can` es siempre
 * true) ven todas. El POS sólo se resalta al centro si hay `canAccessPOS`.
 */
export const filterTabs = (can: (key: PermissionKey) => boolean): VisibleTabs => ({
    left: LEFT_TABS.filter((tab) => can(tab.permission)),
    right: RIGHT_TABS.filter((tab) => can(tab.permission)),
    showPos: can(POS_TAB.permission)
})
