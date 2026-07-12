import {
    FileText,
    HandCoins,
    Landmark,
    Coins,
    BadgeCheck,
    Ban,
    History
} from '@lucide/svelte'
import type { IconComponent } from '$lib/types/icon'
import type { SaleStatusEvent, SaleStatusEventType } from '$lib/api/requests/sales'
import { formatCurrency } from '$lib/utils/numbers'

// Port fiel de placepos desktop (`components/TicketViewer/utils/statusTimeline.ts`).
// Lógica pura y testeable: el componente traduce el `tone` semántico a colores.

export type { SaleStatusEvent, SaleStatusEventType }

// Tono semántico del evento; el componente lo traduce a hsl.
export type TimelineTone = 'slate' | 'emerald' | 'amber' | 'violet' | 'rose'

export interface TimelineDescriptor {
    label: string
    icon: IconComponent
    tone: TimelineTone
}

// Descriptor por defecto para tipos desconocidos (defensa en el borde): nunca
// debería ocurrir con datos del backend, pero evita romper el render.
const FALLBACK_DESCRIPTOR: TimelineDescriptor = {
    label: 'Movimiento',
    icon: History,
    tone: 'slate'
}

const DESCRIPTORS: Record<SaleStatusEventType, TimelineDescriptor> = {
    CREATED: { label: 'Venta creada', icon: FileText, tone: 'slate' },
    COLLECTED: { label: 'Cobrada', icon: HandCoins, tone: 'emerald' },
    CREDIT_OPENED: { label: 'Crédito abierto', icon: Landmark, tone: 'amber' },
    INSTALLMENT: { label: 'Abono', icon: Coins, tone: 'violet' },
    PAID: { label: 'Pagada por completo', icon: BadgeCheck, tone: 'emerald' },
    VOIDED: { label: 'Anulada', icon: Ban, tone: 'rose' }
}

// Mapea el tipo de evento a su etiqueta, icono y tono. Puro y testeable.
export const getTimelineDescriptor = (eventType: SaleStatusEventType): TimelineDescriptor =>
    DESCRIPTORS[eventType] ?? FALLBACK_DESCRIPTOR

// Etiqueta legible del evento combinando el nombre con el monto cuando aplica
// (crédito abierto y abonos traen monto; los demás eventos no).
export const formatTimelineLabel = (event: SaleStatusEvent): string => {
    const { label } = getTimelineDescriptor(event.eventType)
    if (event.amount !== null && event.amount > 0) {
        return `${label} · ${formatCurrency(event.amount)}`
    }
    return label
}

// Normaliza el historial: tolera ausente/vacío y garantiza orden ascendente por
// fecha (el backend ya lo entrega ASC, pero lo reforzamos para no depender de él).
export const prepareTimeline = (history?: SaleStatusEvent[] | null): SaleStatusEvent[] => {
    if (!history || history.length === 0) return []
    return [...history].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
}

// Colores (hsl) por tono, para el punto/icono de cada evento en la línea.
export const TIMELINE_TONE_COLORS: Record<TimelineTone, { fg: string; bg: string }> = {
    slate: { fg: 'hsl(215, 16%, 47%)', bg: 'hsla(215, 16%, 47%, 0.12)' },
    emerald: { fg: 'hsl(158, 64%, 34%)', bg: 'hsla(158, 64%, 38%, 0.12)' },
    amber: { fg: 'hsl(32, 95%, 44%)', bg: 'hsla(32, 95%, 44%, 0.12)' },
    violet: { fg: 'hsl(258, 70%, 56%)', bg: 'hsla(258, 70%, 56%, 0.12)' },
    rose: { fg: 'hsl(0, 84%, 55%)', bg: 'hsla(0, 84%, 55%, 0.12)' }
}
