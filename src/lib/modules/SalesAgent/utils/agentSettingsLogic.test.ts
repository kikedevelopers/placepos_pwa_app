import { describe, it, expect } from 'vitest'
import {
    DEFAULT_DELIVERY_MODES,
    DEFAULT_PAYMENT_METHODS,
    DELIVERY_MODE_OPTIONS,
    MAX_PICKUP_ADDRESS_LENGTH,
    OFF_TOPIC_LIMIT_OPTIONS,
    resolveOffTopicLimit,
    normalizeDeliveryModes,
    toggleDeliveryMode,
    DEFAULT_STOCK_POLICY,
    MAX_PAYMENT_INSTRUCTIONS_LENGTH,
    MAX_STYLE_LENGTH,
    PAYMENT_METHOD_OPTIONS,
    STOCK_POLICY_OPTIONS,
    STYLE_STAGES,
    appendExample,
    hasUnsavedChanges,
    isPaymentMethod,
    isPersonality,
    isStockPolicy,
    normalizePaymentMethods,
    resolveStockPolicy,
    toAgentSettingsForm,
    togglePaymentMethod,
    validateAgentSettings,
    type AgentSettingsFormState
} from './agentSettingsLogic'

const form = (overrides: Partial<AgentSettingsFormState> = {}): AgentSettingsFormState => ({
    bot_name: 'Diana',
    personality: 'amable_profesional',
    stock_policy: 'inform',
    greeting_style: '',
    selling_style: '',
    closing_style: '',
    payment_methods: ['cash', 'bank_transfer'],
    payment_instructions: '',
    delivery_modes: ['pickup', 'delivery'],
    pickup_address: '',
    off_topic_limit: 3,
    ...overrides
})

describe('agentSettingsLogic · stock', () => {
    it('ofrece exactamente las dos políticas del backend', () => {
        expect(STOCK_POLICY_OPTIONS.map((o) => o.value)).toEqual(['inform', 'offer_always'])
    })

    it('el default es avisar cuando no hay stock', () => {
        expect(DEFAULT_STOCK_POLICY).toBe('inform')
    })

    it('isStockPolicy acepta solo valores conocidos', () => {
        expect(isStockPolicy('inform')).toBe(true)
        expect(isStockPolicy('offer_always')).toBe(true)
        expect(isStockPolicy('regalar')).toBe(false)
        expect(isStockPolicy(undefined)).toBe(false)
        expect(isStockPolicy(null)).toBe(false)
    })

    it('resolveStockPolicy usa el valor guardado o cae al default', () => {
        expect(resolveStockPolicy('offer_always')).toBe('offer_always')
        expect(resolveStockPolicy('raro')).toBe('inform')
        expect(resolveStockPolicy(undefined)).toBe('inform')
    })
})

describe('isPersonality', () => {
    it('acepta solo los tres presets', () => {
        expect(isPersonality('amable_profesional')).toBe(true)
        expect(isPersonality('directo_comercial')).toBe(true)
        expect(isPersonality('formal_corporativo')).toBe(true)
        expect(isPersonality('payaso')).toBe(false)
        expect(isPersonality(undefined)).toBe(false)
    })
})

describe('formas de pago', () => {
    it('ofrece las cuatro formas del backend, en su orden', () => {
        expect(PAYMENT_METHOD_OPTIONS.map((o) => o.value)).toEqual([
            'cash',
            'bank_transfer',
            'debit_card',
            'credit_card'
        ])
    })

    it('el default es efectivo y transferencia', () => {
        expect(DEFAULT_PAYMENT_METHODS).toEqual(['cash', 'bank_transfer'])
    })

    it('isPaymentMethod acepta solo valores conocidos', () => {
        expect(isPaymentMethod('debit_card')).toBe(true)
        expect(isPaymentMethod('bitcoin')).toBe(false)
        expect(isPaymentMethod(undefined)).toBe(false)
    })

    it('normalizePaymentMethods quita desconocidos y duplicados y ordena', () => {
        expect(normalizePaymentMethods(['credit_card', 'bitcoin', 'cash', 'cash'])).toEqual([
            'cash',
            'credit_card'
        ])
    })

    it('togglePaymentMethod marca en orden canónico', () => {
        expect(togglePaymentMethod(['credit_card'], 'cash')).toEqual(['cash', 'credit_card'])
    })

    it('togglePaymentMethod desmarca', () => {
        expect(togglePaymentMethod(['cash', 'debit_card'], 'cash')).toEqual(['debit_card'])
    })

    it('togglePaymentMethod nunca deja la lista vacía', () => {
        expect(togglePaymentMethod(['bank_transfer'], 'bank_transfer')).toEqual(['bank_transfer'])
    })
})

describe('estilo propio', () => {
    it('define las tres etapas de la venta en orden', () => {
        expect(STYLE_STAGES.map((s) => s.field)).toEqual([
            'greeting_style',
            'selling_style',
            'closing_style'
        ])
    })

    it('cada etapa trae ideas que caben en el límite', () => {
        for (const stage of STYLE_STAGES) {
            expect(stage.examples.length).toBeGreaterThan(0)
            for (const example of stage.examples) {
                expect(example.label.length).toBeLessThan(30)
                expect(example.text.length).toBeLessThanOrEqual(MAX_STYLE_LENGTH)
            }
        }
    })

    it('appendExample llena un campo vacío', () => {
        expect(appendExample('', 'Saluda breve.')).toBe('Saluda breve.')
    })

    it('appendExample suma al final con un espacio', () => {
        expect(appendExample('Hola vecino. ', 'Saluda breve.')).toBe('Hola vecino. Saluda breve.')
    })

    it('appendExample no repite una idea ya agregada', () => {
        expect(appendExample('Saluda breve.', 'Saluda breve.')).toBe('Saluda breve.')
    })

    it('appendExample no se pasa del máximo', () => {
        const full = 'a'.repeat(95)
        expect(appendExample(full, 'Saluda breve.', 100)).toBe(full)
    })
})

describe('toAgentSettingsForm', () => {
    it('toma todo lo guardado', () => {
        expect(
            toAgentSettingsForm({
                bot_name: 'Diana',
                personality: 'formal_corporativo',
                stock_policy: 'offer_always',
                greeting_style: 'Hola vecino',
                selling_style: 'Lo de la casa',
                closing_style: 'Gracias',
                payment_methods: ['debit_card', 'cash'],
                payment_instructions: 'Nequi 300',
                delivery_modes: ['pickup'],
                pickup_address: 'Calle 10',
                off_topic_limit: 5
            })
        ).toEqual({
            bot_name: 'Diana',
            personality: 'formal_corporativo',
            stock_policy: 'offer_always',
            greeting_style: 'Hola vecino',
            selling_style: 'Lo de la casa',
            closing_style: 'Gracias',
            payment_methods: ['cash', 'debit_card'],
            payment_instructions: 'Nequi 300',
            delivery_modes: ['pickup'],
            pickup_address: 'Calle 10',
            off_topic_limit: 5
        })
    })

    it('servidor viejo sin persona, estilo ni pagos: cae a los defaults (version skew)', () => {
        expect(toAgentSettingsForm({ stock_policy: 'inform' })).toEqual(form({ bot_name: '' }))
    })

    it('valores desconocidos caen a los defaults', () => {
        const result = toAgentSettingsForm({
            personality: 'raro' as never,
            stock_policy: 'raro' as never,
            payment_methods: ['bitcoin' as never]
        })
        expect(result.personality).toBe('amable_profesional')
        expect(result.stock_policy).toBe('inform')
        expect(result.payment_methods).toEqual(['cash', 'bank_transfer'])
    })
})

describe('validateAgentSettings', () => {
    it('happy path: arma el payload completo', () => {
        const result = validateAgentSettings(
            form({
                stock_policy: 'offer_always',
                greeting_style: '  Hola,\n\n vecino ',
                payment_methods: ['credit_card', 'cash'],
                payment_instructions: ' Nequi 300 '
            })
        )
        expect(result).toEqual({
            ok: true,
            payload: {
                bot_name: 'Diana',
                personality: 'amable_profesional',
                stock_policy: 'offer_always',
                greeting_style: 'Hola, vecino',
                selling_style: '',
                closing_style: '',
                payment_methods: ['cash', 'credit_card'],
                payment_instructions: 'Nequi 300',
                delivery_modes: ['pickup', 'delivery'],
                pickup_address: '',
                off_topic_limit: 3
            }
        })
    })

    it('recorta el nombre', () => {
        const result = validateAgentSettings(form({ bot_name: '  Andrea  ' }))
        expect(result.ok && result.payload.bot_name).toBe('Andrea')
    })

    it('acepta un nombre de exactamente 60 caracteres', () => {
        expect(validateAgentSettings(form({ bot_name: 'a'.repeat(60) })).ok).toBe(true)
    })

    it('rechaza un nombre vacío o de solo espacios', () => {
        const result = validateAgentSettings(form({ bot_name: '   ' }))
        expect(result.ok).toBe(false)
        if (!result.ok) expect(result.errors.bot_name).toMatch(/agente/)
    })

    it('rechaza un nombre de más de 60 caracteres', () => {
        const result = validateAgentSettings(form({ bot_name: 'a'.repeat(61) }))
        expect(result.ok).toBe(false)
        if (!result.ok) expect(result.errors.bot_name).toBeTruthy()
    })

    it('rechaza una personalidad no válida', () => {
        const result = validateAgentSettings(form({ personality: 'payaso' as never }))
        expect(result.ok).toBe(false)
        if (!result.ok) expect(result.errors.personality).toBeTruthy()
    })

    it('reporta varios errores a la vez', () => {
        const result = validateAgentSettings(
            form({ bot_name: '', personality: 'x' as never, payment_methods: [] })
        )
        expect(result.ok).toBe(false)
        if (!result.ok)
            expect(Object.keys(result.errors).sort()).toEqual([
                'bot_name',
                'payment_methods',
                'personality'
            ])
    })

    it('una política inválida cae al default en vez de bloquear', () => {
        const result = validateAgentSettings(form({ stock_policy: 'raro' as never }))
        expect(result.ok && result.payload.stock_policy).toBe('inform')
    })

    it('acepta las tres personalidades', () => {
        for (const personality of [
            'amable_profesional',
            'directo_comercial',
            'formal_corporativo'
        ] as const) {
            expect(validateAgentSettings(form({ personality })).ok).toBe(true)
        }
    })

    it('acepta una etapa de exactamente 500 caracteres', () => {
        expect(validateAgentSettings(form({ closing_style: 'a'.repeat(500) })).ok).toBe(true)
    })

    it.each(['greeting_style', 'selling_style', 'closing_style'] as const)(
        'rechaza %s de más de 500 caracteres',
        (field) => {
            const result = validateAgentSettings(form({ [field]: 'a'.repeat(501) }))
            expect(result.ok).toBe(false)
            if (!result.ok) expect(result.errors[field]).toBeTruthy()
        }
    )

    it('rechaza quedarse sin formas de pago', () => {
        const result = validateAgentSettings(form({ payment_methods: [] }))
        expect(result.ok).toBe(false)
        if (!result.ok) expect(result.errors.payment_methods).toMatch(/al menos una/)
    })

    it('rechaza indicaciones de pago de más de 300 caracteres', () => {
        const result = validateAgentSettings(
            form({ payment_instructions: 'a'.repeat(MAX_PAYMENT_INSTRUCTIONS_LENGTH + 1) })
        )
        expect(result.ok).toBe(false)
        if (!result.ok) expect(result.errors.payment_instructions).toBeTruthy()
    })
})

describe('hasUnsavedChanges', () => {
    it('sin cambios: false', () => {
        expect(hasUnsavedChanges(form(), form())).toBe(false)
    })

    it('espacios de más no cuentan como cambio', () => {
        expect(hasUnsavedChanges(form({ bot_name: ' Diana ', greeting_style: '  ' }), form())).toBe(
            false
        )
    })

    it('el orden de las formas de pago no cuenta como cambio', () => {
        expect(
            hasUnsavedChanges(form({ payment_methods: ['bank_transfer', 'cash'] }), form())
        ).toBe(false)
    })

    it.each([
        { bot_name: 'Andrea' },
        { personality: 'directo_comercial' as const },
        { stock_policy: 'offer_always' as const },
        { selling_style: 'Lo de la casa' },
        { payment_methods: ['cash' as const] },
        { payment_instructions: 'Nequi' }
    ])('detecta el cambio %o', (change) => {
        expect(hasUnsavedChanges(form(change), form())).toBe(true)
    })
})

describe('agentSettingsLogic · entregas', () => {
    it('ofrece recoger y domicilio, en el orden del backend; default las dos', () => {
        expect(DELIVERY_MODE_OPTIONS.map((o) => o.value)).toEqual(['pickup', 'delivery'])
        expect(DEFAULT_DELIVERY_MODES).toEqual(['pickup', 'delivery'])
    })

    it('normaliza: orden canónico, sin duplicados ni desconocidos', () => {
        expect(normalizeDeliveryModes(['delivery', 'drone', 'pickup', 'delivery'])).toEqual([
            'pickup',
            'delivery'
        ])
    })

    it('toggle: marca/desmarca y nunca deja la lista vacía', () => {
        expect(toggleDeliveryMode(['pickup', 'delivery'], 'delivery')).toEqual(['pickup'])
        expect(toggleDeliveryMode(['pickup'], 'delivery')).toEqual(['pickup', 'delivery'])
        expect(toggleDeliveryMode(['pickup'], 'pickup')).toEqual(['pickup'])
    })

    it('servidor viejo (sin entregas) o valores raros: las dos', () => {
        expect(toAgentSettingsForm({ stock_policy: 'inform' }).delivery_modes).toEqual([
            'pickup',
            'delivery'
        ])
        expect(
            toAgentSettingsForm({ stock_policy: 'inform', delivery_modes: ['drone' as never] })
                .delivery_modes
        ).toEqual(['pickup', 'delivery'])
    })

    it('valida: lista vacía y dirección demasiado larga', () => {
        const result = validateAgentSettings(
            form({ delivery_modes: [], pickup_address: 'a'.repeat(MAX_PICKUP_ADDRESS_LENGTH + 1) })
        )
        expect(result.ok).toBe(false)
        if (!result.ok) {
            expect(result.errors.delivery_modes).toBe('Elige al menos una forma de entrega.')
            expect(result.errors.pickup_address).toBeTruthy()
        }
    })

    it('el payload lleva las entregas y la dirección colapsada', () => {
        const result = validateAgentSettings(
            form({ delivery_modes: ['pickup'], pickup_address: '  Calle 10\n local 3 ' })
        )
        expect(result.ok && result.payload).toMatchObject({
            delivery_modes: ['pickup'],
            pickup_address: 'Calle 10 local 3'
        })
    })

    it('cambiar entregas o dirección cuenta como cambio sin guardar; espacios no', () => {
        const saved = form()
        expect(hasUnsavedChanges(form({ delivery_modes: ['pickup'] }), saved)).toBe(true)
        expect(hasUnsavedChanges(form({ pickup_address: 'Calle 1' }), saved)).toBe(true)
        expect(hasUnsavedChanges(form({ pickup_address: '   ' }), saved)).toBe(false)
    })
})

describe('agentSettingsLogic · mensajes sin sentido', () => {
    it('opciones: desactivado, 2, 3 y 5', () => {
        expect(OFF_TOPIC_LIMIT_OPTIONS.map((o) => o.value)).toEqual([0, 2, 3, 5])
    })

    it('resolveOffTopicLimit: entero 0..10 o el default (3)', () => {
        expect(resolveOffTopicLimit(0)).toBe(0)
        expect(resolveOffTopicLimit(5)).toBe(5)
        for (const raw of [undefined, -1, 11, 2.5, '3']) expect(resolveOffTopicLimit(raw)).toBe(3)
    })

    it('servidor viejo sin el dato: 3; el payload lo lleva; cambiarlo cuenta como cambio', () => {
        expect(toAgentSettingsForm({ stock_policy: 'inform' }).off_topic_limit).toBe(3)
        const result = validateAgentSettings(form({ off_topic_limit: 0 }))
        expect(result.ok && result.payload.off_topic_limit).toBe(0)
        expect(hasUnsavedChanges(form({ off_topic_limit: 5 }), form())).toBe(true)
    })
})
