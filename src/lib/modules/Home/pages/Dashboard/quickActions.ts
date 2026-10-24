import { BarChart3, Boxes, Landmark, Truck, Users, Wallet } from '@lucide/svelte'
import type { IconComponent } from '$lib/types/icon'

/**
 * Accesos rápidos del Inicio. Seis, en una grilla de 3 × 2. El Catálogo se
 * retiró de la PWA (ya no se usa): no debe volver a aparecer aquí.
 */
export interface QuickAction {
    label: string
    icon: IconComponent
    route: string
}

export const QUICK_ACTIONS: readonly QuickAction[] = [
    { label: 'Reportes', icon: BarChart3, route: '/reportes' },
    { label: 'Clientes', icon: Users, route: '/clientes' },
    { label: 'Inventario', icon: Boxes, route: '/inventario' },
    { label: 'Compras', icon: Truck, route: '/compras' },
    { label: 'Billeteras', icon: Wallet, route: '/billeteras' },
    { label: 'Bancos', icon: Landmark, route: '/bancos' }
]
