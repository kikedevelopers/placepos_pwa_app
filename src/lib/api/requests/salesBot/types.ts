/** Personalidades de venta del bot (deben coincidir con el enum de pos_api). */
export type SalesBotPersonality = 'amable_profesional' | 'directo_comercial' | 'formal_corporativo'

/** Config PÚBLICA del bot de Telegram (sin el token). */
export interface SalesBotConfig {
    channel: 'telegram'
    enabled: boolean
    /** true si hay un token guardado (el valor nunca viaja al cliente). */
    has_token: boolean
    /** @username del bot (getMe). Público. */
    bot_username: string | null
    owner_chat_id: string | null
    updated_at: string | null
}

/** Payload para guardar la config del bot. */
export interface UpdateSalesBotConfigPayload {
    enabled: boolean
    /** Token de @BotFather. Omitir/vacío = conservar el guardado. */
    token?: string
    owner_chat_id?: string
}

/** Resultado de verificar un token sin guardarlo. */
export interface ValidateSalesBotTokenResult {
    valid: boolean
    bot_username: string | null
    bot_name: string | null
}

/**
 * Política de stock del agente:
 *  - `inform`: si no hay existencias, lo dice (y ofrece alternativa).
 *  - `offer_always`: ofrece y vende todo sin mencionar el stock.
 */
export type SalesBotStockPolicy = 'inform' | 'offer_always'

/** Formas de pago que el agente puede ofrecer (deben coincidir con pos_api). */
export type SalesBotPaymentMethod = 'cash' | 'bank_transfer' | 'debit_card' | 'credit_card'

/** Entregas que ofrece el negocio: `pickup` = recogen en el negocio; `delivery` = domicilio. */
export type SalesBotDeliveryMode = 'pickup' | 'delivery'

/**
 * Ajustes del agente (iguales en todos los canales): persona (nombre,
 * personalidad y estilo propio), formas de pago y política de stock. Todo lo
 * que no es `stock_policy` es opcional por si el servidor aún no lo envía
 * (version skew).
 */
export interface SalesBotSettings {
    /** Nombre con el que se presenta. Vacío = el nombre por defecto. */
    bot_name?: string
    personality?: SalesBotPersonality
    stock_policy: SalesBotStockPolicy
    /** Cómo quiere el dueño que salude / venda / cierre. Vacío = el del preset. */
    greeting_style?: string
    selling_style?: string
    closing_style?: string
    payment_methods?: SalesBotPaymentMethod[]
    /** Indicaciones de pago que el agente comparte (cuentas, datáfono...). */
    payment_instructions?: string
    /** Entregas que ofrece (al menos una). Servidor viejo: no viene. */
    delivery_modes?: SalesBotDeliveryMode[]
    /** Dónde se recoge. Vacío = la dirección de Mi Negocio. */
    pickup_address?: string
    /** Mensajes sin sentido antes de despedirse (0 = filtro apagado). Servidor viejo: no viene. */
    off_topic_limit?: number
}

/** Payload para guardar los ajustes del agente. */
export interface UpdateSalesBotSettingsPayload {
    bot_name: string
    personality: SalesBotPersonality
    stock_policy: SalesBotStockPolicy
    greeting_style: string
    selling_style: string
    closing_style: string
    payment_methods: SalesBotPaymentMethod[]
    payment_instructions: string
    delivery_modes: SalesBotDeliveryMode[]
    pickup_address: string
    off_topic_limit: number
}

/** Config PÚBLICA de WhatsApp (sin el token). */
export interface WhatsappBotConfig {
    channel: 'whatsapp'
    enabled: boolean
    /** true si el negocio guardó un token propio (el valor nunca viaja). */
    has_token: boolean
    phone_number_id: string | null
    waba_id: string | null
    owner_chat_id: string | null
    updated_at: string | null
}

/** Payload para guardar la config de WhatsApp (modo manual). */
export interface UpdateWhatsappConfigPayload {
    enabled: boolean
    phone_number_id?: string
    /** Token propio del negocio. Omitir/vacío = conservar o usar el compartido. */
    token?: string
    waba_id?: string
    owner_chat_id?: string
}
