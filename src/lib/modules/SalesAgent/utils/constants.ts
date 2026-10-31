import { Building2, Handshake, Sparkles } from '@lucide/svelte'
import type { IconComponent } from '$lib/types/icon'
import type { SalesBotPersonality } from '$lib/api/requests/salesBot'

export interface PersonalityPreset {
    value: SalesBotPersonality
    label: string
    /** Resumen de una línea del tono, para el selector. */
    description: string
    icon: IconComponent
}

/**
 * Los 3 presets de personalidad que el dueño elige. Solo cambian el TONO del
 * bot; las reglas de negocio (no revelar costos, consultar inventario, cerrar)
 * son las mismas. Deben coincidir con el enum de pos_api.
 */
export const PERSONALITY_PRESETS: readonly PersonalityPreset[] = [
    {
        value: 'amable_profesional',
        label: 'Amable y Profesional',
        description: 'Cálido y cercano, sin perder el profesionalismo. Ideal para la mayoría.',
        icon: Handshake
    },
    {
        value: 'directo_comercial',
        label: 'Directo y Comercial',
        description: 'Va al grano, mensajes cortos y orientado a cerrar la venta rápido.',
        icon: Sparkles
    },
    {
        value: 'formal_corporativo',
        label: 'Formal y Corporativo',
        description: 'Registro formal, trato de «usted» y un tono corporativo y serio.',
        icon: Building2
    }
] as const

export const DEFAULT_PERSONALITY: SalesBotPersonality = 'amable_profesional'

/** Longitud máxima del nombre del bot (coincide con el CHECK de la BD). */
export const MAX_BOT_NAME_LENGTH = 60
