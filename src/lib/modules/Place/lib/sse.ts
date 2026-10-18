/**
 * Parser SSE del stream de `/ai/chat` (espejo del de placepos).
 *
 * El backend emite tramas con nombre (`event: delta` + `data: {...}`). Puro para
 * poder probar los casos reales: tramas partidas entre dos chunks de red,
 * heartbeats y JSON corrupto.
 */

import { parseCard, type AssistantCard } from './cards'
import { parseCredits, type AiCredits } from './credits'

export interface SseFrame {
    event: string
    data: string
}

export interface SseSplitResult {
    frames: SseFrame[]
    /** Trama incompleta que debe concatenarse con el siguiente chunk. */
    rest: string
}

export const splitSseFrames = (buffer: string): SseSplitResult => {
    const normalized = buffer.replace(/\r\n/g, '\n')
    const blocks = normalized.split('\n\n')
    const rest = blocks.pop() ?? ''

    const frames: SseFrame[] = []
    for (const block of blocks) {
        const lines = block.split('\n')
        let event = 'message'
        const data: string[] = []

        for (const line of lines) {
            if (line.startsWith(':')) continue // heartbeat
            if (line.startsWith('event:')) {
                event = line.slice(6).trim()
                continue
            }
            if (line.startsWith('data:')) data.push(line.slice(5).trimStart())
        }

        if (data.length > 0) frames.push({ event, data: data.join('\n') })
    }

    return { frames, rest }
}

/** Eventos del stream ya tipados. */
export type AiStreamEvent =
    | { type: 'delta'; text: string }
    | {
          type: 'tool'
          name: string
          label: string
          status: 'running' | 'done' | 'error'
      }
    | { type: 'card'; card: AssistantCard }
    /** Créditos del día tras reservar este mensaje (o al agotarse). */
    | { type: 'credits'; credits: AiCredits }
    | { type: 'done'; notice?: string }
    | { type: 'error'; message: string }

/**
 * Convierte una trama en un evento tipado. `null` si el evento es desconocido o
 * el JSON no sirve: el stream sigue, no se rompe por una trama mala.
 */
export const parseStreamFrame = (frame: SseFrame): AiStreamEvent | null => {
    let payload: unknown
    try {
        payload = JSON.parse(frame.data)
    } catch {
        return null
    }
    if (!payload || typeof payload !== 'object') return null
    const data = payload as Record<string, unknown>

    switch (frame.event) {
        case 'delta':
            return typeof data.text === 'string' && data.text.length > 0
                ? { type: 'delta', text: data.text }
                : null
        case 'tool': {
            if (typeof data.name !== 'string') return null
            const status =
                data.status === 'running' || data.status === 'done' || data.status === 'error'
                    ? data.status
                    : 'done'
            return {
                type: 'tool',
                name: data.name,
                label: typeof data.label === 'string' ? data.label : data.name,
                status
            }
        }
        case 'credits': {
            const credits = parseCredits(data)
            return credits ? { type: 'credits', credits } : null
        }
        case 'card': {
            const card = parseCard(data.card)
            return card ? { type: 'card', card } : null
        }
        case 'done':
            return {
                type: 'done',
                notice: typeof data.notice === 'string' ? data.notice : undefined
            }
        case 'error':
            return {
                type: 'error',
                message:
                    typeof data.message === 'string' && data.message.trim().length > 0
                        ? data.message
                        : 'Ocurrió un error al generar la respuesta.'
            }
        default:
            return null
    }
}
