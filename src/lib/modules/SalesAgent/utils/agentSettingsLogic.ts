import {
    Banknote,
    CreditCard,
    Landmark,
    PackageCheck,
    PackageOpen,
    Store,
    Truck,
    WalletCards
} from '@lucide/svelte'
import type {
    SalesBotDeliveryMode,
    SalesBotPaymentMethod,
    SalesBotPersonality,
    SalesBotSettings,
    SalesBotStockPolicy,
    UpdateSalesBotSettingsPayload
} from '$lib/api/requests/salesBot'
import type { IconComponent } from '$lib/types/icon'
import { DEFAULT_PERSONALITY, MAX_BOT_NAME_LENGTH, PERSONALITY_PRESETS } from './constants'

export interface StockPolicyOption {
    value: SalesBotStockPolicy
    label: string
    description: string
    icon: IconComponent
}

/**
 * Opciones de qué hace el agente cuando un producto no tiene existencias.
 * Deben coincidir con el enum de pos_api (`sales_bot_settings.stock_policy`).
 */
export const STOCK_POLICY_OPTIONS: readonly StockPolicyOption[] = [
    {
        value: 'inform',
        label: 'Avisar cuando no hay stock',
        description:
            'Si un producto está agotado, el agente lo dice y ofrece una alternativa o tomar el pedido para cuando llegue.',
        icon: PackageCheck
    },
    {
        value: 'offer_always',
        label: 'Ofrecer siempre',
        description:
            'El agente ofrece y vende todos los productos sin mencionar el stock. Tú confirmas la disponibilidad al despachar.',
        icon: PackageOpen
    }
] as const

export const DEFAULT_STOCK_POLICY: SalesBotStockPolicy = 'inform'

export const isStockPolicy = (value: unknown): value is SalesBotStockPolicy =>
    STOCK_POLICY_OPTIONS.some((option) => option.value === value)

/** Política a mostrar en el formulario: la guardada si es válida, si no el default. */
export const resolveStockPolicy = (value: unknown): SalesBotStockPolicy =>
    isStockPolicy(value) ? value : DEFAULT_STOCK_POLICY

export const isPersonality = (value: unknown): value is SalesBotPersonality =>
    PERSONALITY_PRESETS.some((preset) => preset.value === value)

export interface PaymentMethodOption {
    value: SalesBotPaymentMethod
    label: string
    description: string
    icon: IconComponent
}

/** Formas de pago, en el orden canónico de pos_api. */
export const PAYMENT_METHOD_OPTIONS: readonly PaymentMethodOption[] = [
    {
        value: 'cash',
        label: 'Efectivo',
        description: 'Contra entrega o en el punto',
        icon: Banknote
    },
    {
        value: 'bank_transfer',
        label: 'Transferencia',
        description: 'Consignación, Nequi, Daviplata…',
        icon: Landmark
    },
    {
        value: 'debit_card',
        label: 'Tarjeta débito',
        description: 'Datáfono o link de pago',
        icon: WalletCards
    },
    {
        value: 'credit_card',
        label: 'Tarjeta de crédito',
        description: 'Datáfono o link de pago',
        icon: CreditCard
    }
] as const

/** Lo que el agente ofrecía antes de poder elegir (y el default del servidor). */
export const DEFAULT_PAYMENT_METHODS: readonly SalesBotPaymentMethod[] = ['cash', 'bank_transfer']

export const isPaymentMethod = (value: unknown): value is SalesBotPaymentMethod =>
    PAYMENT_METHOD_OPTIONS.some((option) => option.value === value)

/** Formas válidas, sin duplicados y en orden canónico. */
export const normalizePaymentMethods = (values: readonly unknown[]): SalesBotPaymentMethod[] =>
    PAYMENT_METHOD_OPTIONS.map((option) => option.value).filter((method) => values.includes(method))

export interface DeliveryModeOption {
    value: SalesBotDeliveryMode
    label: string
    description: string
    icon: IconComponent
}

/** Entregas, en el orden canónico de pos_api. */
export const DELIVERY_MODE_OPTIONS: readonly DeliveryModeOption[] = [
    {
        value: 'pickup',
        label: 'Recogen en el negocio',
        description: 'El cliente pasa por su pedido',
        icon: Store
    },
    {
        value: 'delivery',
        label: 'Envío a domicilio',
        description: 'Se lo llevas a su dirección',
        icon: Truck
    }
] as const

/** Default del servidor: las dos. */
export const DEFAULT_DELIVERY_MODES: readonly SalesBotDeliveryMode[] = ['pickup', 'delivery']

export const MAX_PICKUP_ADDRESS_LENGTH = 250

/** Opciones del filtro de mensajes sin sentido (0 = apagado). Default del servidor: 3. */
export const OFF_TOPIC_LIMIT_OPTIONS: readonly { value: number; label: string }[] = [
    { value: 0, label: 'Desactivado' },
    { value: 2, label: '2 mensajes' },
    { value: 3, label: '3 mensajes' },
    { value: 5, label: '5 mensajes' }
] as const

export const DEFAULT_OFF_TOPIC_LIMIT = 3
export const MAX_OFF_TOPIC_LIMIT = 10

/** Límite válido (entero 0..10) o el default. */
export const resolveOffTopicLimit = (value: unknown): number =>
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= MAX_OFF_TOPIC_LIMIT
        ? value
        : DEFAULT_OFF_TOPIC_LIMIT

/** Entregas válidas, sin duplicados y en orden canónico. */
export const normalizeDeliveryModes = (values: readonly unknown[]): SalesBotDeliveryMode[] =>
    DELIVERY_MODE_OPTIONS.map((option) => option.value).filter((mode) => values.includes(mode))

/**
 * Marca o desmarca una entrega. Nunca deja la lista vacía: el negocio tiene que
 * entregar de alguna forma.
 */
export const toggleDeliveryMode = (
    current: readonly SalesBotDeliveryMode[],
    mode: SalesBotDeliveryMode
): SalesBotDeliveryMode[] => {
    if (current.includes(mode)) {
        const next = current.filter((m) => m !== mode)
        return next.length === 0 ? normalizeDeliveryModes(current) : normalizeDeliveryModes(next)
    }
    return normalizeDeliveryModes([...current, mode])
}

/**
 * Marca o desmarca una forma de pago. Nunca deja la lista vacía: desmarcar la
 * última no hace nada (el agente necesita al menos una para cerrar).
 */
export const togglePaymentMethod = (
    current: readonly SalesBotPaymentMethod[],
    method: SalesBotPaymentMethod
): SalesBotPaymentMethod[] => {
    if (current.includes(method)) {
        const next = current.filter((m) => m !== method)
        return next.length === 0 ? normalizePaymentMethods(current) : normalizePaymentMethods(next)
    }
    return normalizePaymentMethods([...current, method])
}

export const MAX_STYLE_LENGTH = 500
export const MAX_PAYMENT_INSTRUCTIONS_LENGTH = 300

export type StyleField = 'greeting_style' | 'selling_style' | 'closing_style'

export interface StyleStage {
    field: StyleField
    label: string
    hint: string
    placeholder: string
    /** Ideas que el dueño puede sumar con un clic (`label` corto para el chip). */
    examples: readonly StyleExample[]
}

export interface StyleExample {
    label: string
    text: string
}

/** Las tres etapas de la venta que el dueño puede ajustar, en orden. */
export const STYLE_STAGES: readonly StyleStage[] = [
    {
        field: 'greeting_style',
        label: 'Saludo',
        hint: 'Cómo recibe al cliente en el primer mensaje del día.',
        placeholder: 'Ej: Saluda con «¡Hola, vecino!» y pregunta qué va a preparar hoy.',
        examples: [
            {
                label: '«¡Hola, vecino!»',
                text: 'Saluda con «¡Hola, vecino!» y pregunta qué va a preparar hoy.'
            },
            {
                label: 'Preguntar su nombre',
                text: 'Agradece que nos escriba y pregunta su nombre para atenderlo mejor.'
            },
            {
                label: 'Breve y sin emojis',
                text: 'Saluda breve, sin emojis, y ve directo a lo que necesita.'
            }
        ]
    },
    {
        field: 'selling_style',
        label: 'Asesoría y venta',
        hint: 'Cómo entiende la necesidad, recomienda y sugiere complementos.',
        placeholder: 'Ej: Recomienda primero los productos de la casa y explica cómo se usan.',
        examples: [
            {
                label: 'Productos de la casa',
                text: 'Recomienda primero los productos de la casa y explica en una frase cómo se usan.'
            },
            {
                label: 'Preguntar para cuántos',
                text: 'Antes de recomendar, pregunta para cuántas personas es y ajusta la cantidad.'
            },
            {
                label: 'Sugerir complementos',
                text: 'Si piden algo para cocinar, sugiere los productos que lo acompañan.'
            }
        ]
    },
    {
        field: 'closing_style',
        label: 'Cierre',
        hint: 'Cómo confirma el pedido y se despide.',
        placeholder: 'Ej: Lee de nuevo la dirección antes de pedir la confirmación.',
        examples: [
            {
                label: 'Confirmar la dirección',
                text: 'Lee de nuevo la dirección antes de pedir la confirmación.'
            },
            {
                label: 'Último complemento',
                text: 'Antes de cerrar, ofrece una sola vez algo para completar el pedido.'
            },
            {
                label: 'Despedida cálida',
                text: 'Despídete agradeciendo la compra y deseándole un buen día.'
            }
        ]
    }
] as const

/**
 * Suma una idea al texto del dueño: la agrega al final (si no estaba ya) sin
 * pasarse del máximo. Si no cabe, devuelve el texto tal cual.
 */
export const appendExample = (current: string, example: string, max = MAX_STYLE_LENGTH): string => {
    const base = current.trim()
    if (base.includes(example)) return current
    const next = base ? `${base} ${example}` : example
    return next.length > max ? current : next
}

/** Estado editable de los ajustes del agente (iguales en todos los canales). */
export interface AgentSettingsFormState {
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

export interface AgentSettingsFormErrors {
    bot_name?: string
    personality?: string
    greeting_style?: string
    selling_style?: string
    closing_style?: string
    payment_methods?: string
    payment_instructions?: string
    delivery_modes?: string
    pickup_address?: string
}

export type AgentSettingsValidationResult =
    | { ok: true; payload: UpdateSalesBotSettingsPayload }
    | { ok: false; errors: AgentSettingsFormErrors }

/**
 * Estado inicial del formulario desde lo guardado. Tolera un servidor que aún
 * no envía la persona, el estilo o los pagos (version skew): cae a los defaults.
 */
export const toAgentSettingsForm = (settings: SalesBotSettings): AgentSettingsFormState => {
    const methods = Array.isArray(settings.payment_methods)
        ? normalizePaymentMethods(settings.payment_methods)
        : []
    const deliveryModes = Array.isArray(settings.delivery_modes)
        ? normalizeDeliveryModes(settings.delivery_modes)
        : []
    return {
        bot_name: settings.bot_name ?? '',
        personality: isPersonality(settings.personality)
            ? settings.personality
            : DEFAULT_PERSONALITY,
        stock_policy: resolveStockPolicy(settings.stock_policy),
        greeting_style: settings.greeting_style ?? '',
        selling_style: settings.selling_style ?? '',
        closing_style: settings.closing_style ?? '',
        payment_methods: methods.length > 0 ? methods : [...DEFAULT_PAYMENT_METHODS],
        payment_instructions: settings.payment_instructions ?? '',
        delivery_modes: deliveryModes.length > 0 ? deliveryModes : [...DEFAULT_DELIVERY_MODES],
        pickup_address: settings.pickup_address ?? '',
        off_topic_limit: resolveOffTopicLimit(settings.off_topic_limit)
    }
}

/** Texto libre a una sola línea (igual que lo guarda el servidor). */
const collapse = (value: string): string => value.replace(/\s+/g, ' ').trim()

/**
 * Valida los ajustes del agente y arma el payload. Reglas:
 *   - El nombre es obligatorio (así se presenta en todos los canales) y
 *     no puede superar `MAX_BOT_NAME_LENGTH`.
 *   - La personalidad debe ser uno de los presets.
 *   - Cada etapa del estilo admite hasta `MAX_STYLE_LENGTH` caracteres.
 *   - Al menos una forma de pago; indicaciones hasta `MAX_PAYMENT_INSTRUCTIONS_LENGTH`.
 *   - Al menos una forma de entrega; dirección de recogida hasta `MAX_PICKUP_ADDRESS_LENGTH`.
 *   - La política de stock inválida cae al default.
 */
export const validateAgentSettings = (
    form: AgentSettingsFormState
): AgentSettingsValidationResult => {
    const errors: AgentSettingsFormErrors = {}

    const botName = form.bot_name.trim()
    if (botName.length === 0) {
        errors.bot_name = 'Ponle un nombre a tu agente (así se presenta en el chat).'
    } else if (botName.length > MAX_BOT_NAME_LENGTH) {
        errors.bot_name = `El nombre no puede superar ${MAX_BOT_NAME_LENGTH} caracteres.`
    }

    if (!isPersonality(form.personality)) {
        errors.personality = 'Elige una personalidad para tu agente.'
    }

    const styles = {} as Record<StyleField, string>
    for (const stage of STYLE_STAGES) {
        const text = collapse(form[stage.field])
        if (text.length > MAX_STYLE_LENGTH) {
            errors[stage.field] = `Máximo ${MAX_STYLE_LENGTH} caracteres.`
        }
        styles[stage.field] = text
    }

    const paymentMethods = normalizePaymentMethods(form.payment_methods)
    if (paymentMethods.length === 0) {
        errors.payment_methods = 'Elige al menos una forma de pago.'
    }

    const paymentInstructions = collapse(form.payment_instructions)
    if (paymentInstructions.length > MAX_PAYMENT_INSTRUCTIONS_LENGTH) {
        errors.payment_instructions = `Máximo ${MAX_PAYMENT_INSTRUCTIONS_LENGTH} caracteres.`
    }

    const deliveryModes = normalizeDeliveryModes(form.delivery_modes)
    if (deliveryModes.length === 0) {
        errors.delivery_modes = 'Elige al menos una forma de entrega.'
    }

    const pickupAddress = collapse(form.pickup_address)
    if (pickupAddress.length > MAX_PICKUP_ADDRESS_LENGTH) {
        errors.pickup_address = `Máximo ${MAX_PICKUP_ADDRESS_LENGTH} caracteres.`
    }

    if (Object.keys(errors).length > 0) {
        return { ok: false, errors }
    }

    return {
        ok: true,
        payload: {
            bot_name: botName,
            personality: form.personality,
            stock_policy: resolveStockPolicy(form.stock_policy),
            ...styles,
            payment_methods: paymentMethods,
            payment_instructions: paymentInstructions,
            delivery_modes: deliveryModes,
            pickup_address: pickupAddress,
            off_topic_limit: resolveOffTopicLimit(form.off_topic_limit)
        }
    }
}

/**
 * ¿Hay cambios sin guardar? Compara como los guardaría el servidor (texto
 * colapsado, pagos en orden canónico), así un espacio de más no cuenta.
 */
export const hasUnsavedChanges = (
    form: AgentSettingsFormState,
    saved: AgentSettingsFormState
): boolean => {
    const text = (s: AgentSettingsFormState) => [
        s.bot_name.trim(),
        s.personality,
        s.stock_policy,
        collapse(s.greeting_style),
        collapse(s.selling_style),
        collapse(s.closing_style),
        normalizePaymentMethods(s.payment_methods).join(','),
        collapse(s.payment_instructions),
        normalizeDeliveryModes(s.delivery_modes).join(','),
        collapse(s.pickup_address),
        String(resolveOffTopicLimit(s.off_topic_limit))
    ]
    const a = text(form)
    const b = text(saved)
    return a.some((value, index) => value !== b[index])
}
