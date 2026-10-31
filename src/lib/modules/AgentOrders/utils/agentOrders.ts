import { formatCurrency } from '$lib/utils/numbers'
import {
    bogotaDayNumber,
    bogotaParts,
    longDateTimeLabel,
    shortDateLabel,
    timeLabel
} from '$lib/utils/bogotaTime'
import type {
    AgentOrder,
    AgentOrderItem,
    AgentOrderStatus,
    AgentOrderStatusFilter
} from '$lib/api/requests/agentOrders/types'

// Lógica pura del informe "Agente" (sin DOM) para poder probarla. Espejo de
// `modules/Reports/AgentOrdersReport/utils/agentOrders.ts` de placepos.

export const STATUS_OPTIONS: { value: AgentOrderStatusFilter; label: string }[] = [
    { value: 'pending', label: 'Por tomar' },
    { value: 'taken', label: 'Tomados' },
    { value: 'dismissed', label: 'Descartados' },
    { value: 'all', label: 'Todos' }
]

export const STATUS_LABEL: Record<AgentOrderStatus, string> = {
    pending: 'Por tomar',
    taken: 'Tomado',
    dismissed: 'Descartado'
}

/** Nombre del canal para la persona (no el identificador técnico). */
export const channelLabel = (channel: string): string => {
    switch (channel) {
        case 'telegram':
            return 'Telegram'
        case 'whatsapp':
            return 'WhatsApp'
        case 'whatsapp-web':
            return 'WhatsApp'
        default:
            return channel ? channel.charAt(0).toUpperCase() + channel.slice(1) : 'Chat'
    }
}

/** `true` para los canales de WhatsApp (abren chat con wa.me). */
export const isWhatsappChannel = (channel: string): boolean =>
    channel === 'whatsapp' || channel === 'whatsapp-web'

const digitsOf = (value: string | null | undefined): string => (value ?? '').replace(/\D/g, '')

/**
 * Número en formato internacional para WhatsApp. Un celular colombiano de 10
 * dígitos (3xx) recibe el indicativo 57; un número que ya trae indicativo se deja
 * igual. Lo que no parece un teléfono → `null`.
 */
export const toWhatsappNumber = (raw: string | null | undefined): string | null => {
    const digits = digitsOf(raw)
    if (digits.length === 10 && digits.startsWith('3')) return `57${digits}`
    if (digits.length >= 11 && digits.length <= 15) return digits
    return null
}

/** Enlace para escribirle al cliente por WhatsApp, o `null` sin número válido. */
export const whatsappLink = (raw: string | null | undefined): string | null => {
    const number = toWhatsappNumber(raw)
    return number ? `https://wa.me/${number}` : null
}

/**
 * Teléfono legible: celular colombiano → "+57 300 123 4567" (o "300 123 4567"
 * sin indicativo); cualquier otro → "+dígitos". Vacío → cadena vacía.
 */
export const formatPhone = (raw: string | null | undefined): string => {
    const digits = digitsOf(raw)
    if (!digits) return ''
    if (digits.length === 12 && digits.startsWith('57') && digits[2] === '3') {
        return `+57 ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`
    }
    if (digits.length === 10 && digits.startsWith('3')) {
        return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
    }
    return digits.length > 10 ? `+${digits}` : digits
}

/**
 * Teléfono de contacto del cliente: el que dio en la charla y, si no dio
 * ninguno, el del canal (su número de WhatsApp).
 */
export const contactPhone = (
    order: Pick<AgentOrder, 'customer_phone' | 'chat_phone'>
): string | null => order.customer_phone?.trim() || order.chat_phone?.trim() || null

/**
 * Cómo ubicar el chat del cliente en su canal: el número de WhatsApp (formateado
 * como lo muestra WhatsApp) o, si el canal no lo da, por qué.
 */
export const chatIdentity = (
    order: Pick<AgentOrder, 'channel' | 'chat_phone' | 'chat_display_name'>
): { phone: string | null; label: string } => {
    const phone = order.chat_phone?.trim() || null
    if (phone) return { phone, label: formatPhone(phone) }
    const name = order.chat_display_name?.trim()
    if (isWhatsappChannel(order.channel)) {
        return {
            phone: null,
            label: name
                ? `WhatsApp no compartió el número · ${name}`
                : 'WhatsApp no compartió el número'
        }
    }
    return {
        phone: null,
        label: name ? `${channelLabel(order.channel)} · ${name}` : channelLabel(order.channel)
    }
}

/** Enlace para abrir el chat de WhatsApp del cliente (el número con el que habló). */
export const chatWhatsappLink = (
    order: Pick<AgentOrder, 'channel' | 'chat_phone' | 'customer_phone'>
): string | null =>
    isWhatsappChannel(order.channel)
        ? (whatsappLink(order.chat_phone) ?? whatsappLink(order.customer_phone))
        : whatsappLink(order.customer_phone)

/** Nombre a mostrar: el que dio para recibir y, si no, su nombre en el chat. */
export const customerLabel = (
    order: Pick<AgentOrder, 'customer_name' | 'chat_display_name'>
): string => order.customer_name?.trim() || order.chat_display_name?.trim() || 'Cliente sin nombre'

/** Iniciales para el avatar ("Ana María Pérez" → "AM"). */
export const initialsOf = (name: string): string =>
    name
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0]?.toUpperCase() ?? '')
        .join('') || '?'

/** Cantidad sin ceros de relleno y con coma decimal ("2.5000" → "2,5"). */
export const quantityLabel = (quantity: string): string => {
    const value = Number(quantity)
    if (!Number.isFinite(value)) return quantity
    return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 4 }).format(value)
}

/** Cuenta del negocio que atendió, legible (`@bot` tal cual; número formateado). */
export const channelAccountLabel = (
    order: Pick<AgentOrder, 'channel' | 'channel_account'>
): string | null => {
    const account = order.channel_account?.trim()
    if (!account) return null
    if (isWhatsappChannel(order.channel)) return formatPhone(account) || account
    return account
}

/**
 * Hace cuánto llegó el pedido, en corto, para la bandeja: "ahora", "hace 5 min",
 * "hace 2 h", "ayer 4:30 p. m." o "28 oct, 9:15 a. m.". `now` se inyecta en tests.
 */
export const waitingLabel = (createdAt: string, now: Date = new Date()): string => {
    const created = bogotaParts(createdAt)
    if (!created) return ''
    const minutes = Math.floor((now.getTime() - new Date(createdAt).getTime()) / 60_000)
    if (minutes < 1) return 'ahora'
    if (minutes < 60) return `hace ${minutes} min`
    if (minutes < 6 * 60) return `hace ${Math.floor(minutes / 60)} h`

    const days = bogotaDayNumber(now)! - bogotaDayNumber(createdAt)!
    const time = timeLabel(created)
    if (days === 0) return `hoy ${time}`
    if (days === 1) return `ayer ${time}`
    const today = bogotaParts(now)!
    return created.year === today.year
        ? `${shortDateLabel(created)}, ${time}`
        : shortDateLabel(created, true)
}

/** Fecha y hora completas (Bogotá) para el detalle. */
export const fullDateLabel = (iso: string): string => {
    const parts = bogotaParts(iso)
    return parts ? longDateTimeLabel(parts) : ''
}

/** Resumen corto de los productos para la fila ("Café libra, Arepas y 2 más"). */
export const itemsPreview = (items: AgentOrderItem[], max = 2): string => {
    if (items.length === 0) return 'Sin productos'
    const names = items.slice(0, max).map((item) => item.name)
    const rest = items.length - names.length
    if (rest <= 0) return names.join(' · ')
    return `${names.join(' · ')} y ${rest} más`
}

/** Texto plano del pedido para copiar y pegar (chat, nota de despacho, POS). */
export const orderAsText = (order: AgentOrder): string => {
    const lines: string[] = [`Pedido ${order.reference} · ${channelLabel(order.channel)}`, '']
    for (const item of order.items) {
        lines.push(
            `${quantityLabel(item.quantity)} × ${item.name} — ${formatCurrency(item.unit_price)} = ${formatCurrency(item.total)}`
        )
    }
    lines.push('', `Total: ${formatCurrency(order.total)}`, '')
    lines.push(`Cliente: ${customerLabel(order)}`)
    const phone = contactPhone(order)
    if (phone) lines.push(`Teléfono: ${formatPhone(phone)}`)
    lines.push(
        order.delivery_mode === 'recoger'
            ? 'Entrega: recoge en el negocio'
            : `Entrega: domicilio${order.delivery_address ? ` — ${order.delivery_address}` : ''}`
    )
    if (order.payment_method) lines.push(`Pago: ${order.payment_method}`)
    if (order.notes) lines.push(`Notas: ${order.notes}`)
    return lines.join('\n')
}

/**
 * Ids que aparecieron en la lista nueva y no estaban en la anterior: los pedidos
 * que acaban de llegar en tiempo real (para resaltarlos un momento). En la
 * primera carga (`previous` null) no hay "nuevos".
 */
export const newlyArrivedIds = (previous: number[] | null, next: number[]): number[] => {
    if (previous === null) return []
    const known = new Set(previous)
    return next.filter((id) => !known.has(id))
}
