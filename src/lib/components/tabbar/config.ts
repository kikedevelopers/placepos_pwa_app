import { BarChart3, Boxes, Home, Receipt, ShoppingCart } from '@lucide/svelte'
import type { IconComponent } from '$lib/types/icon'

export type Tab = {
    route: string
    match: string
    label: string
    icon: IconComponent
}

// El POS va resaltado en el centro; los demás son pestañas normales (2 a cada lado).
export const LEFT_TABS: Tab[] = [
    { route: '/', match: '/', label: 'Inicio', icon: Home },
    { route: '/reportes', match: '/reportes', label: 'Reportes', icon: BarChart3 }
]
export const RIGHT_TABS: Tab[] = [
    { route: '/inventario', match: '/inventario', label: 'Inventario', icon: Boxes },
    { route: '/gastos', match: '/gastos', label: 'Gastos', icon: Receipt }
]
export const POS_TAB: Tab = { route: '/pos', match: '/pos', label: 'POS', icon: ShoppingCart }

export const ACTIVE = 'hsl(217, 91%, 50%)'
export const INACTIVE = 'hsl(215, 16%, 47%)'
