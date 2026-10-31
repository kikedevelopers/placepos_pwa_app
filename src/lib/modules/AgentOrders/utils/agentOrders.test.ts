import { describe, expect, it } from 'vitest'
import type { AgentOrder } from '$lib/api/requests/agentOrders/types'
import {
    chatIdentity,
    chatWhatsappLink,
    channelAccountLabel,
    channelLabel,
    contactPhone,
    customerLabel,
    formatPhone,
    initialsOf,
    isWhatsappChannel,
    itemsPreview,
    newlyArrivedIds,
    orderAsText,
    quantityLabel,
    toWhatsappNumber,
    waitingLabel,
    whatsappLink
} from './agentOrders'

const order = (patch: Partial<AgentOrder> = {}): AgentOrder => ({
    id: 1,
    reference: 'P-7B0F3C1E',
    status: 'pending',
    channel: 'whatsapp-web',
    channel_account: '573110000000',
    chat_id: '573001234567@s.whatsapp.net',
    chat_display_name: 'Anita',
    chat_phone: '573001234567',
    customer_name: 'Ana Pérez',
    customer_phone: null,
    delivery_mode: 'domicilio',
    delivery_address: 'Cra 1 #2-3',
    payment_method: 'Transferencia',
    notes: null,
    items: [
        {
            product_id: 5,
            name: 'Café libra',
            quantity: '2.0000',
            unit_price: '18000.00',
            total: '36000.00'
        },
        { product_id: 9, name: 'Arepa', quantity: '0.5000', unit_price: '1500.00', total: '750.00' }
    ],
    items_count: 2,
    total: 36750,
    status_note: null,
    status_changed_at: null,
    status_changed_by: null,
    created_at: '2026-10-31T15:00:00.000Z',
    ...patch
})

describe('channelLabel / isWhatsappChannel', () => {
    it('nombra los canales conocidos y capitaliza los demás', () => {
        expect(channelLabel('telegram')).toBe('Telegram')
        expect(channelLabel('whatsapp')).toBe('WhatsApp')
        expect(channelLabel('whatsapp-web')).toBe('WhatsApp')
        expect(channelLabel('instagram')).toBe('Instagram')
        expect(channelLabel('')).toBe('Chat')
    })

    it('distingue WhatsApp (Cloud y QR) del resto', () => {
        expect(isWhatsappChannel('whatsapp')).toBe(true)
        expect(isWhatsappChannel('whatsapp-web')).toBe(true)
        expect(isWhatsappChannel('telegram')).toBe(false)
    })
})

describe('toWhatsappNumber / whatsappLink', () => {
    it('celular colombiano de 10 dígitos recibe el 57', () => {
        expect(toWhatsappNumber('300 123 4567')).toBe('573001234567')
        expect(whatsappLink('3001234567')).toBe('https://wa.me/573001234567')
    })

    it('con indicativo se deja igual', () => {
        expect(toWhatsappNumber('+57 300 123 4567')).toBe('573001234567')
        expect(toWhatsappNumber('14155550123')).toBe('14155550123')
    })

    it('lo que no parece un teléfono → null', () => {
        expect(toWhatsappNumber('6012345')).toBeNull()
        expect(toWhatsappNumber('')).toBeNull()
        expect(toWhatsappNumber(null)).toBeNull()
        expect(whatsappLink('abc')).toBeNull()
    })
})

describe('formatPhone', () => {
    it('agrupa celulares colombianos con y sin indicativo', () => {
        expect(formatPhone('573001234567')).toBe('+57 300 123 4567')
        expect(formatPhone('3001234567')).toBe('300 123 4567')
    })

    it('otros números: + dígitos; fijos cortos tal cual; vacío → ""', () => {
        expect(formatPhone('14155550123')).toBe('+14155550123')
        expect(formatPhone('6012345')).toBe('6012345')
        expect(formatPhone(null)).toBe('')
    })
})

describe('contactPhone / customerLabel / initialsOf', () => {
    it('prefiere el teléfono que dio en la charla; si no, el del canal', () => {
        expect(contactPhone(order({ customer_phone: '3109998877' }))).toBe('3109998877')
        expect(contactPhone(order())).toBe('573001234567')
        expect(contactPhone(order({ chat_phone: null }))).toBeNull()
    })

    it('nombre: el de quien recibe, luego el del chat, luego genérico', () => {
        expect(customerLabel(order())).toBe('Ana Pérez')
        expect(customerLabel(order({ customer_name: ' ' }))).toBe('Anita')
        expect(customerLabel(order({ customer_name: null, chat_display_name: null }))).toBe(
            'Cliente sin nombre'
        )
    })

    it('iniciales de hasta dos palabras', () => {
        expect(initialsOf('ana maría pérez')).toBe('AM')
        expect(initialsOf('Ana')).toBe('A')
        expect(initialsOf('  ')).toBe('?')
    })
})

describe('quantityLabel / itemsPreview', () => {
    it('cantidad sin ceros de relleno y con coma decimal', () => {
        expect(quantityLabel('2.0000')).toBe('2')
        expect(quantityLabel('0.5000')).toBe('0,5')
        expect(quantityLabel('1234.0000')).toBe('1.234')
        expect(quantityLabel('raro')).toBe('raro')
    })

    it('resume los productos con "y N más"', () => {
        expect(itemsPreview(order().items)).toBe('Café libra · Arepa')
        const many = [...order().items, { ...order().items[0], product_id: 3, name: 'Pan' }]
        expect(itemsPreview(many)).toBe('Café libra · Arepa y 1 más')
        expect(itemsPreview([])).toBe('Sin productos')
    })
})

describe('channelAccountLabel', () => {
    it('WhatsApp: formatea el número; Telegram: el @usuario tal cual', () => {
        expect(channelAccountLabel(order())).toBe('+57 311 000 0000')
        expect(
            channelAccountLabel(order({ channel: 'telegram', channel_account: '@tienda_bot' }))
        ).toBe('@tienda_bot')
        expect(channelAccountLabel(order({ channel_account: null }))).toBeNull()
    })
})

describe('waitingLabel', () => {
    const now = new Date('2026-10-31T20:00:00.000Z') // 3:00 p. m. Bogotá

    it('reciente: ahora / minutos / horas', () => {
        expect(waitingLabel('2026-10-31T19:59:40.000Z', now)).toBe('ahora')
        expect(waitingLabel('2026-10-31T19:55:00.000Z', now)).toBe('hace 5 min')
        expect(waitingLabel('2026-10-31T17:30:00.000Z', now)).toBe('hace 2 h')
    })

    it('más viejo: hoy / ayer / fecha, en hora Colombia', () => {
        expect(waitingLabel('2026-10-31T12:30:00.000Z', now)).toMatch(/^hoy 7:30 a/)
        // 01:00 UTC del 31 = 8 p. m. del 30 en Bogotá → ayer.
        expect(waitingLabel('2026-10-31T01:00:00.000Z', now)).toMatch(/^ayer 8:00 p/)
        expect(waitingLabel('2026-10-20T15:00:00.000Z', now)).toMatch(/^20 oct/)
        expect(waitingLabel('2025-10-20T15:00:00.000Z', now)).toBe('20 oct 2025')
    })

    it('fecha inválida → vacío', () => {
        expect(waitingLabel('no-es-fecha', now)).toBe('')
    })
})

describe('orderAsText', () => {
    it('arma el pedido completo para copiar', () => {
        const text = orderAsText(order({ notes: 'Tocar el timbre' }))
        expect(text).toContain('Pedido P-7B0F3C1E · WhatsApp')
        expect(text).toMatch(/2 × Café libra — \$\s?18\.000 = \$\s?36\.000/)
        expect(text).toMatch(/0,5 × Arepa/)
        expect(text).toMatch(/Total: \$\s?36\.750/)
        expect(text).toContain('Cliente: Ana Pérez')
        expect(text).toContain('Teléfono: +57 300 123 4567')
        expect(text).toContain('Entrega: domicilio — Cra 1 #2-3')
        expect(text).toContain('Pago: Transferencia')
        expect(text).toContain('Notas: Tocar el timbre')
    })

    it('recoger y sin datos opcionales', () => {
        const text = orderAsText(
            order({
                delivery_mode: 'recoger',
                delivery_address: null,
                payment_method: null,
                chat_phone: null
            })
        )
        expect(text).toContain('Entrega: recoge en el negocio')
        expect(text).not.toContain('Pago:')
        expect(text).not.toContain('Teléfono:')
        expect(text).not.toContain('Notas:')
    })
})

describe('newlyArrivedIds', () => {
    it('primera carga: ninguno es "nuevo"', () => {
        expect(newlyArrivedIds(null, [1, 2])).toEqual([])
    })

    it('devuelve solo los que no estaban', () => {
        expect(newlyArrivedIds([1, 2], [3, 1, 2, 4])).toEqual([3, 4])
        expect(newlyArrivedIds([1, 2], [1])).toEqual([])
    })
})

describe('chatIdentity / chatWhatsappLink', () => {
    it('WhatsApp con número: lo muestra como WhatsApp y abre ESE chat', () => {
        expect(chatIdentity(order())).toEqual({ phone: '573001234567', label: '+57 300 123 4567' })
        expect(chatWhatsappLink(order({ customer_phone: '3109998877' }))).toBe(
            'https://wa.me/573001234567'
        )
    })

    it('WhatsApp @lid sin número: lo dice (no deja el hueco) y enlaza el que dio, si dio uno', () => {
        const hidden = order({ chat_phone: null, chat_display_name: 'Enrique' })
        expect(chatIdentity(hidden)).toEqual({
            phone: null,
            label: 'WhatsApp no compartió el número · Enrique'
        })
        expect(chatIdentity(order({ chat_phone: null, chat_display_name: null })).label).toBe(
            'WhatsApp no compartió el número'
        )
        expect(chatWhatsappLink(hidden)).toBeNull()
        expect(chatWhatsappLink({ ...hidden, customer_phone: '3109998877' })).toBe(
            'https://wa.me/573109998877'
        )
    })

    it('Telegram: canal y nombre; sin enlace salvo que haya dado teléfono', () => {
        const tg = order({ channel: 'telegram', chat_phone: null, chat_display_name: 'Ana' })
        expect(chatIdentity(tg)).toEqual({ phone: null, label: 'Telegram · Ana' })
        expect(chatWhatsappLink(tg)).toBeNull()
        expect(chatWhatsappLink({ ...tg, customer_phone: '3001234567' })).toBe(
            'https://wa.me/573001234567'
        )
    })
})
