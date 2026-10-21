import { streamAiChat } from '$lib/api/requests/ai'
import {
    CARD_ONLY_TURN,
    isPreviewCard,
    parseCards,
    settledStatus,
    type AssistantCard
} from '$lib/modules/Place/lib/cards'
import { refreshAfterCard } from '$lib/modules/Place/lib/treasury-refresh'
import type { TimedCredits } from '$lib/modules/Place/lib/credits'

export interface ChatTool {
    name: string
    label: string
    status: 'running' | 'done' | 'error'
}

export interface ChatMessage {
    id: string
    role: 'user' | 'assistant'
    content: string
    created_at: number
    is_streaming?: boolean
    is_error?: boolean
    tools?: ChatTool[]
    notice?: string
    /** Tarjetas del servidor (vista previa del pedido / pedido creado). */
    cards?: AssistantCard[]
}

const STORAGE_KEY = 'placepos.pwa.ai.chat.v1'

const uid = (): string =>
    typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`

/**
 * Conversación con Place en la PWA. Una sola conversación (como en placepos),
 * persistida en localStorage; "Nueva conversación" la borra de verdad. El
 * streaming SSE va pintando la respuesta token a token.
 */
class PlaceChatStore {
    messages = $state<ChatMessage[]>([])
    isStreaming = $state(false)
    /** Créditos del día según el último mensaje enviado. */
    credits = $state<TimedCredits | null>(null)
    private controller: AbortController | null = null
    private hydrated = false

    hydrate(): void {
        if (this.hydrated || typeof localStorage === 'undefined') return
        this.hydrated = true
        try {
            const raw = localStorage.getItem(STORAGE_KEY)
            if (!raw) return
            const parsed = JSON.parse(raw) as { messages?: ChatMessage[] }
            if (Array.isArray(parsed.messages)) {
                // Nunca rehidratar un mensaje a medio escribir.
                this.messages = parsed.messages
                    .filter((m) => !m.is_streaming)
                    // Las tarjetas guardadas se revalidan: una corrupta no se pinta.
                    .map((m) => ({
                        ...m,
                        is_streaming: false,
                        cards: parseCards(m.cards)
                    }))
            }
        } catch {
            /* localStorage corrupto: arrancamos en limpio */
        }
    }

    private persist(): void {
        if (typeof localStorage === 'undefined') return
        try {
            const stable = this.messages.filter((m) => !m.is_streaming)
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, messages: stable }))
        } catch {
            /* sin persistencia no se rompe nada */
        }
    }

    reset(): void {
        this.stop()
        this.messages = []
        this.persist()
    }

    stop(): void {
        this.controller?.abort()
        this.controller = null
        const last = this.messages[this.messages.length - 1]
        if (last?.is_streaming) last.is_streaming = false
        this.isStreaming = false
    }

    retryLast(): void {
        // Quita la última respuesta del asistente y reenvía el último turno del usuario.
        if (this.isStreaming) return
        let lastUser: ChatMessage | undefined
        for (let i = this.messages.length - 1; i >= 0; i--) {
            if (this.messages[i].role === 'user') {
                lastUser = this.messages[i]
                break
            }
        }
        if (!lastUser) return
        // Elimina todo lo posterior al último mensaje del usuario (su respuesta).
        const idx = this.messages.lastIndexOf(lastUser)
        this.messages = this.messages.slice(0, idx + 1)
        void this.runStream()
    }

    /** Agrega la tarjeta y cierra las vistas previas pendientes anteriores. */
    private applyCard(target: ChatMessage, card: AssistantCard): void {
        for (const message of this.messages) {
            for (const item of message.cards ?? []) {
                if (!isPreviewCard(item) || item.status !== 'pending') continue
                const status = settledStatus(card, item)
                if (status) item.status = status
            }
        }
        target.cards = [...(target.cards ?? []), card]
        refreshAfterCard(card)
    }

    async send(text: string): Promise<void> {
        const content = text.trim()
        if (content.length === 0 || this.isStreaming) return
        this.messages.push({ id: uid(), role: 'user', content, created_at: Date.now() })
        await this.runStream()
    }

    private async runStream(): Promise<void> {
        const assistant: ChatMessage = {
            id: uid(),
            role: 'assistant',
            content: '',
            created_at: Date.now(),
            is_streaming: true,
            tools: []
        }
        this.messages.push(assistant)
        this.isStreaming = true

        // Un turno de Place con solo la tarjeta sigue siendo su turno: sin él,
        // el "sí" siguiente no respondería a ningún resumen.
        const turns = this.messages
            .filter((m) => !m.is_streaming && !m.is_error)
            .map((m) => ({
                role: m.role,
                content:
                    m.content.trim().length === 0 &&
                    m.role === 'assistant' &&
                    (m.cards?.length ?? 0) > 0
                        ? CARD_ONLY_TURN
                        : m.content
            }))
            .filter((turn) => turn.content.trim().length > 0)

        this.controller = new AbortController()

        await streamAiChat({
            turns,
            signal: this.controller.signal,
            onEvent: (event) => {
                const msg = this.messages[this.messages.length - 1]
                if (!msg || msg.id !== assistant.id) return
                if (event.type === 'credits') {
                    this.credits = { credits: event.credits, at: Date.now() }
                } else if (event.type === 'card') {
                    this.applyCard(msg, event.card)
                } else if (event.type === 'delta') {
                    msg.content += event.text
                } else if (event.type === 'tool') {
                    const tools = msg.tools ?? []
                    const existing = tools.find((t) => t.name === event.name)
                    if (existing) existing.status = event.status
                    else
                        tools.push({
                            name: event.name,
                            label: event.label,
                            status: event.status
                        })
                    msg.tools = tools
                } else if (event.type === 'done') {
                    msg.is_streaming = false
                    if (event.notice) msg.notice = event.notice
                    if (msg.content.trim().length === 0 && !event.notice && !msg.cards?.length) {
                        msg.content = 'No recibí respuesta. Intenta de nuevo.'
                        msg.is_error = true
                    }
                } else if (event.type === 'error') {
                    msg.is_streaming = false
                    msg.is_error = true
                    msg.content = event.message
                }
            }
        })

        assistant.is_streaming = false
        this.isStreaming = false
        this.controller = null
        this.persist()
    }
}

export const placeChat = new PlaceChatStore()
