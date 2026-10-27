import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ChatAttachment, ChatTurn } from '$lib/modules/Place/lib/attachments'

/**
 * Conversación con adjuntos: el mensaje guarda metadata + miniatura (nunca el
 * archivo) y CADA petición manda los `attachment_ids` de todo el historial.
 */
const sent_turns: ChatTurn[][] = []
vi.mock('$lib/api/requests/ai', () => ({
    streamAiChat: vi.fn(async ({ turns, onEvent }: { turns: ChatTurn[]; onEvent: (e: unknown) => void }) => {
        sent_turns.push(turns)
        onEvent({ type: 'delta', text: 'Listo.' })
        onEvent({ type: 'done' })
    })
}))
vi.mock('$lib/modules/Place/lib/treasury-refresh', () => ({ refreshAfterCard: vi.fn() }))

const memory = new Map<string, string>()
const STORAGE_KEY = 'placepos.pwa.ai.chat.v1'

const attachment = (id: string, extra: Partial<ChatAttachment> = {}): ChatAttachment => ({
    id,
    file_name: `${id}.jpg`,
    mime_type: 'image/jpeg',
    size_bytes: 1000,
    expires_at: '2026-10-29T08:00:00.000Z',
    ...extra
})

beforeAll(() => {
    vi.stubGlobal('localStorage', {
        getItem: (key: string) => memory.get(key) ?? null,
        setItem: (key: string, value: string) => void memory.set(key, value),
        removeItem: (key: string) => void memory.delete(key)
    })
    // Historial de ANTES de los adjuntos + uno con adjuntos (uno corrupto).
    memory.set(
        STORAGE_KEY,
        JSON.stringify({
            version: 1,
            messages: [
                { id: 'old-1', role: 'user', content: 'ventas de hoy', created_at: 1 },
                { id: 'old-2', role: 'assistant', content: 'Vendiste $100.', created_at: 2 },
                {
                    id: 'old-3',
                    role: 'user',
                    content: '',
                    created_at: 3,
                    attachments: [attachment('prev'), { id: 'roto' }]
                },
                { id: 'old-4', role: 'assistant', content: 'Leí la factura.', created_at: 4 }
            ]
        })
    )
})

describe('placeChat · adjuntos', () => {
    beforeEach(() => {
        sent_turns.length = 0
    })

    it('rehidrata el historial antiguo y valida los adjuntos guardados', async () => {
        const { placeChat } = await import('./chat.svelte')
        placeChat.hydrate()
        expect(placeChat.messages).toHaveLength(4)
        expect(placeChat.messages[0].attachments).toBeUndefined()
        expect(placeChat.messages[2].attachments).toEqual([attachment('prev')])
    })

    it('enviar solo con adjuntos: turno con content vacío + ids de TODO el historial', async () => {
        const { placeChat } = await import('./chat.svelte')
        const thumb = 'data:image/jpeg;base64,THUMB'
        await placeChat.send('', [attachment('nueva', { thumbnail_data_url: thumb })])

        const turns = sent_turns[0]
        expect(turns.filter((t) => t.attachment_ids)).toEqual([
            { role: 'user', content: '', attachment_ids: ['prev'] },
            { role: 'user', content: '', attachment_ids: ['nueva'] }
        ])
        expect(turns[0]).toEqual({ role: 'user', content: 'ventas de hoy' })

        // Se persiste la metadata con la miniatura, nunca el archivo.
        const stored = JSON.parse(memory.get(STORAGE_KEY) ?? '{}') as {
            messages: Array<{ attachments?: ChatAttachment[] }>
        }
        const last_user = stored.messages.filter((m) => m.attachments).pop()
        expect(last_user?.attachments).toEqual([attachment('nueva', { thumbnail_data_url: thumb })])
    })

    it('la siguiente pregunta (sin adjuntos) vuelve a mandar los ids anteriores', async () => {
        const { placeChat } = await import('./chat.svelte')
        await placeChat.send('¿cuánto suma?')
        const with_ids = sent_turns[0].filter((t) => t.attachment_ids).map((t) => t.attachment_ids)
        expect(with_ids).toEqual([['prev'], ['nueva']])
        expect(sent_turns[0].at(-1)).toEqual({ role: 'user', content: '¿cuánto suma?' })
    })

    it('máximo 5 adjuntos por mensaje', async () => {
        const { placeChat } = await import('./chat.svelte')
        await placeChat.send('muchas', ['1', '2', '3', '4', '5', '6'].map((id) => attachment(id)))
        const last_user = [...placeChat.messages].reverse().find((m) => m.role === 'user')
        expect(last_user?.attachments?.map((a) => a.id)).toEqual(['1', '2', '3', '4', '5'])
    })

    it('sin texto ni adjuntos no envía nada', async () => {
        const { placeChat } = await import('./chat.svelte')
        const before = placeChat.messages.length
        await placeChat.send('   ', [])
        expect(placeChat.messages).toHaveLength(before)
        expect(sent_turns).toHaveLength(0)
    })
})
