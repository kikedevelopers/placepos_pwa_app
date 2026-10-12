import api from '$lib/api/config'
import { env } from '$lib/constants/env'
import { getAuthToken } from '$lib/api/storage'
import { parseStreamFrame, splitSseFrames, type AiStreamEvent } from '$lib/modules/Place/lib/sse'

/**
 * Cliente de Place (el asistente) contra pos_api — espejo del de placepos.
 *
 * El chat es cloud-only por diseño: la llave de Gemini vive en el servidor y el
 * acceso es POR CUENTA (`companies.ai_enabled`). `/ai/status` combina ambos en
 * `enabled`; con él en false, el cliente oculta el botón y bloquea la ruta.
 *
 * El chat NO usa axios: la respuesta es un stream SSE. `fetch` + `ReadableStream`
 * permite ir pintando token a token (efecto "escribiendo").
 */

export interface AiToolSummary {
    name: string
    label: string
    summary: string
}

export interface AiStatus {
    enabled: boolean
    assistantName: string
    defaultModel: string
    models: string[]
    tools: AiToolSummary[]
}

const toToolSummary = (value: unknown): AiToolSummary | null => {
    if (!value || typeof value !== 'object') return null
    const tool = value as Record<string, unknown>
    if (typeof tool.name !== 'string' || tool.name.length === 0) return null
    return {
        name: tool.name,
        label: typeof tool.label === 'string' ? tool.label : tool.name,
        summary: typeof tool.summary === 'string' ? tool.summary : ''
    }
}

export const getAiStatus = async (): Promise<AiStatus> => {
    const { data } = await api.get('/ai/status')
    const payload = (data?.payload ?? {}) as Record<string, unknown>
    return {
        enabled: payload.enabled === true,
        assistantName: typeof payload.assistantName === 'string' ? payload.assistantName : '',
        defaultModel: typeof payload.defaultModel === 'string' ? payload.defaultModel : '',
        models: Array.isArray(payload.models) ? (payload.models as string[]) : [],
        tools: Array.isArray(payload.tools)
            ? payload.tools.map(toToolSummary).filter((t): t is AiToolSummary => t !== null)
            : []
    }
}

export interface AiGreeting {
    text: string
    source: 'ai' | 'fallback'
}

export const getAiGreeting = async (): Promise<AiGreeting | null> => {
    try {
        const { data } = await api.get('/ai/greeting')
        const payload = (data?.payload ?? {}) as Partial<AiGreeting>
        const text = typeof payload.text === 'string' ? payload.text.trim() : ''
        if (text.length === 0) return null
        return { text, source: payload.source === 'ai' ? 'ai' : 'fallback' }
    } catch {
        return null
    }
}

export interface StreamChatParams {
    turns: Array<{ role: 'user' | 'assistant'; content: string }>
    signal: AbortSignal
    onEvent: (event: AiStreamEvent) => void
}

const describeHttpError = async (response: Response): Promise<string> => {
    if (response.status === 401) return 'Tu sesión expiró. Vuelve a iniciar sesión.'
    if (response.status === 402) return 'Tu suscripción está vencida. Renuévala para usar la IA.'
    if (response.status === 403) return 'Tu cuenta no tiene habilitado el asistente.'
    if (response.status === 404) return 'Este servidor no tiene habilitado el asistente.'
    if (response.status === 429) return 'Demasiadas solicitudes seguidas. Espera un momento.'
    try {
        const body = (await response.json()) as { error?: unknown; message?: unknown }
        if (typeof body?.error === 'string' && body.error.trim()) return body.error
        if (typeof body?.message === 'string' && body.message.trim()) return body.message
    } catch {
        /* sin cuerpo JSON */
    }
    return 'No se pudo contactar al asistente. Intenta de nuevo.'
}

/**
 * Abre el stream y entrega eventos ya tipados. Resuelve cuando el stream
 * termina; nunca lanza por errores del servidor (los reporta como evento
 * `error`) salvo que el `AbortController` lo cancele.
 */
export const streamAiChat = async ({ turns, signal, onEvent }: StreamChatParams): Promise<void> => {
    const token = await getAuthToken().catch(() => null)
    const isNgrok = env.apiBaseUrl.includes('ngrok')

    let response: Response
    try {
        response = await fetch(`${env.apiBaseUrl}/ai/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'text/event-stream',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...(isNgrok ? { 'ngrok-skip-browser-warning': 'true' } : {})
            },
            body: JSON.stringify({ turns }),
            signal
        })
    } catch (error) {
        if (signal.aborted) return
        onEvent({
            type: 'error',
            message:
                error instanceof TypeError
                    ? 'No hay conexión con el servidor. Revisa tu internet e intenta de nuevo.'
                    : 'No se pudo contactar al asistente. Intenta de nuevo.'
        })
        return
    }

    if (!response.ok) {
        onEvent({ type: 'error', message: await describeHttpError(response) })
        return
    }
    if (!response.body) {
        onEvent({ type: 'error', message: 'El servidor no devolvió ninguna respuesta.' })
        return
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    try {
        for (;;) {
            const { done, value } = await reader.read()
            if (done) break
            buffer += decoder.decode(value, { stream: true })
            const { frames, rest } = splitSseFrames(buffer)
            buffer = rest
            for (const frame of frames) {
                const event = parseStreamFrame(frame)
                if (event) onEvent(event)
            }
        }
    } catch {
        if (!signal.aborted) {
            onEvent({ type: 'error', message: 'Se interrumpió la respuesta. Intenta de nuevo.' })
        }
    }
}
