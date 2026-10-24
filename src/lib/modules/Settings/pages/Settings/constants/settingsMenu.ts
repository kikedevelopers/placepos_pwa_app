import { BellRing, Building2, Palette, Store, UserRound } from '@lucide/svelte'
import type { IconComponent } from '$lib/types/icon'
import type { SettingsView } from '../types'

/**
 * Menú de Configuración agrupado como los Ajustes de iOS. Cada entrada lleva
 * su color de icono (cuadro sólido). "Mi cuenta" es solo del dueño.
 */
export interface SettingsEntry {
    view: Exclude<SettingsView, 'home'>
    label: string
    detail: string
    icon: IconComponent
    /** Color sólido del cuadro del icono. */
    color: string
    ownerOnly?: boolean
}

export interface SettingsGroup {
    title: string
    entries: SettingsEntry[]
}

export const SETTINGS_GROUPS: readonly SettingsGroup[] = [
    {
        title: 'Cuenta',
        entries: [
            { view: 'account', label: 'Mi cuenta', detail: 'Datos personales y seguridad', icon: UserRound, color: '#2563eb', ownerOnly: true }
        ]
    },
    {
        title: 'Negocio',
        entries: [
            { view: 'business', label: 'Mi negocio', detail: 'Datos, punto de equilibrio y consecutivos', icon: Building2, color: '#4f46e5' },
            { view: 'pos', label: 'P.O.S', detail: 'Márgenes, inventario e informes', icon: Store, color: '#16a34a' },
            { view: 'alerts', label: 'Alertas', detail: 'Notificaciones automáticas', icon: BellRing, color: '#ea580c' }
        ]
    },
    {
        title: 'Apariencia',
        entries: [{ view: 'theme', label: 'Tema', detail: 'Claro u oscuro', icon: Palette, color: '#64748b' }]
    }
]

/** Grupos visibles para el rol: sin las entradas de dueño y sin grupos vacíos. */
export function visibleSettingsGroups(isOwner: boolean): SettingsGroup[] {
    return SETTINGS_GROUPS.map((g) => ({ ...g, entries: g.entries.filter((e) => isOwner || !e.ownerOnly) })).filter(
        (g) => g.entries.length > 0
    )
}
