import { describe, expect, it, vi } from 'vitest'
import { INVALID_TYPE_MESSAGE, TOO_LARGE_MESSAGE, TOO_MANY_MESSAGE, type ChatAttachment } from '$lib/modules/Place/lib/attachments'
import type { PreparedImage } from '$lib/modules/Place/lib/prepare-image'
import { AttachmentDraft, canSubmitMessage, type AttachmentDraftDeps } from './attachment-draft.svelte'

const file = (name: string, type: string, size = 1000): File => {
    const f = new File([new Uint8Array(1)], name, { type })
    Object.defineProperty(f, 'size', { value: size })
    return f
}

const uploaded = (f: File, n = 1): ChatAttachment => ({
    id: `id-${n}-${f.name}`,
    file_name: f.name,
    mime_type: f.type,
    size_bytes: f.size,
    expires_at: '2026-10-29T08:00:00.000Z'
})

/** Promesa controlable desde el test. */
const deferred = <T>() => {
    let resolve!: (value: T) => void
    let reject!: (error: unknown) => void
    const promise = new Promise<T>((res, rej) => {
        resolve = res
        reject = rej
    })
    return { promise, resolve, reject }
}

const setup = (overrides: Partial<AttachmentDraftDeps> = {}) => {
    const deps: AttachmentDraftDeps = {
        upload: vi.fn(async (f: File) => uploaded(f)),
        prepareImage: vi.fn(
            async (f: File): Promise<PreparedImage> => ({
                ok: true,
                file: f,
                thumbnail_data_url: 'data:image/jpeg;base64,T',
                was_resized: false
            })
        ),
        notify: vi.fn(),
        ...overrides
    }
    return { draft: new AttachmentDraft(deps), deps }
}

describe('AttachmentDraft · subir al elegir', () => {
    it('foto → se prepara, se sube y queda lista con su miniatura', async () => {
        const { draft, deps } = setup()
        await draft.add([file('factura.jpg', 'image/jpeg')])
        expect(deps.prepareImage).toHaveBeenCalledTimes(1)
        expect(draft.items[0]).toMatchObject({ status: 'ready', file_name: 'factura.jpg' })
        expect(draft.ready).toEqual([
            { ...uploaded(file('factura.jpg', 'image/jpeg')), thumbnail_data_url: 'data:image/jpeg;base64,T' }
        ])
        expect(draft.is_busy).toBe(false)
    })

    it('PDF → no pasa por la preparación de fotos y no lleva miniatura', async () => {
        const { draft, deps } = setup()
        await draft.add([file('factura.pdf', 'application/pdf')])
        expect(deps.prepareImage).not.toHaveBeenCalled()
        expect(draft.ready[0]).not.toHaveProperty('thumbnail_data_url')
        expect(draft.items[0].status).toBe('ready')
    })

    it('la foto reducida es la que se sube y su tamaño se refleja', async () => {
        const reduced = file('factura.jpg', 'image/jpeg', 500)
        const { draft, deps } = setup({
            prepareImage: vi.fn(async () => ({ ok: true as const, file: reduced, was_resized: true }))
        })
        await draft.add([file('factura.jpg', 'image/jpeg', 9_000_000)])
        expect(deps.upload).toHaveBeenCalledWith(reduced, expect.any(AbortSignal))
        expect(draft.items[0].size_bytes).toBe(500)
    })

    it('mientras sube: ocupado (no se puede enviar)', async () => {
        const pending = deferred<ChatAttachment>()
        const { draft } = setup({ upload: vi.fn(() => pending.promise) })
        const done = draft.add([file('f.pdf', 'application/pdf')])
        expect(draft.items[0].status).toBe('uploading')
        expect(draft.is_busy).toBe(true)
        pending.resolve(uploaded(file('f.pdf', 'application/pdf')))
        await done
        expect(draft.is_busy).toBe(false)
    })
})

describe('AttachmentDraft · validación y límites', () => {
    it('tipo inválido → aviso y no entra a la caja', async () => {
        const { draft, deps } = setup()
        await draft.add([file('video.mp4', 'video/mp4')])
        expect(draft.items).toHaveLength(0)
        expect(deps.notify).toHaveBeenCalledWith(`video.mp4: ${INVALID_TYPE_MESSAGE}`)
        expect(deps.upload).not.toHaveBeenCalled()
    })

    it('PDF de más de 15 MB → aviso, no se sube', async () => {
        const { draft, deps } = setup()
        await draft.add([file('grande.pdf', 'application/pdf', 16 * 1024 * 1024)])
        expect(draft.items).toHaveLength(0)
        expect(deps.notify).toHaveBeenCalledWith(`grande.pdf: ${TOO_LARGE_MESSAGE}`)
    })

    it('máximo 5 por mensaje: el sexto se rechaza con aviso', async () => {
        const { draft, deps } = setup()
        await draft.add([1, 2, 3, 4].map((n) => file(`${n}.pdf`, 'application/pdf')))
        await draft.add([file('5.pdf', 'application/pdf'), file('6.pdf', 'application/pdf')])
        expect(draft.items).toHaveLength(5)
        expect(deps.notify).toHaveBeenCalledWith(TOO_MANY_MESSAGE)
        expect(deps.upload).toHaveBeenCalledTimes(5)
    })

    it('foto imposible de reducir que no cabe → error SIN reintento', async () => {
        const { draft, deps } = setup({
            prepareImage: vi.fn(async () => ({ ok: false as const, error: TOO_LARGE_MESSAGE }))
        })
        await draft.add([file('enorme.jpg', 'image/jpeg', 30 * 1024 * 1024)])
        expect(draft.items[0]).toMatchObject({ status: 'error', error: TOO_LARGE_MESSAGE })
        expect(draft.canRetry(draft.items[0].local_id)).toBe(false)
        expect(deps.upload).not.toHaveBeenCalled()
        expect(draft.has_errors).toBe(true)
    })
})

describe('AttachmentDraft · errores, reintento y quitar', () => {
    it('falla la subida → error en español; reintentar la completa', async () => {
        const upload = vi
            .fn<AttachmentDraftDeps['upload']>()
            .mockRejectedValueOnce({ status: 413 })
            .mockImplementation(async (f) => uploaded(f, 2))
        const { draft } = setup({ upload })
        await draft.add([file('f.pdf', 'application/pdf')])
        const [item] = draft.items
        expect(item).toMatchObject({ status: 'error', error: TOO_LARGE_MESSAGE })
        expect(draft.ready).toEqual([])
        expect(draft.canRetry(item.local_id)).toBe(true)

        await draft.retry(item.local_id)
        expect(draft.items[0]).toMatchObject({ status: 'ready', error: undefined })
        expect(draft.ready[0].id).toBe('id-2-f.pdf')
        expect(upload).toHaveBeenCalledTimes(2)
    })

    it('403 AI_NOT_ENABLED → mensaje de cuenta sin asistente', async () => {
        const { draft } = setup({
            upload: vi.fn(async () => Promise.reject({ status: 403, payload: { code: 'AI_NOT_ENABLED' } }))
        })
        await draft.add([file('f.pdf', 'application/pdf')])
        expect(draft.items[0].error).toBe('Tu cuenta no tiene habilitado el asistente.')
    })

    it('reintentar algo que no está en error no hace nada', async () => {
        const { draft, deps } = setup()
        await draft.add([file('f.pdf', 'application/pdf')])
        await draft.retry(draft.items[0].local_id)
        await draft.retry('no-existe')
        expect(deps.upload).toHaveBeenCalledTimes(1)
    })

    it('quitar mientras sube → aborta la subida y no reaparece', async () => {
        const pending = deferred<ChatAttachment>()
        let signal: AbortSignal | undefined
        const { draft } = setup({
            upload: vi.fn((_f: File, s: AbortSignal) => {
                signal = s
                return pending.promise
            })
        })
        const done = draft.add([file('f.pdf', 'application/pdf')])
        draft.remove(draft.items[0].local_id)
        expect(signal?.aborted).toBe(true)
        pending.resolve(uploaded(file('f.pdf', 'application/pdf')))
        await done
        expect(draft.items).toHaveLength(0)
        expect(draft.ready).toEqual([])
    })

    it('quitar mientras se reduce la foto → no se sube', async () => {
        const preparing = deferred<PreparedImage>()
        const { draft, deps } = setup({ prepareImage: vi.fn(() => preparing.promise) })
        const f = file('a.jpg', 'image/jpeg')
        const done = draft.add([f])
        expect(draft.items[0].status).toBe('processing')
        draft.remove(draft.items[0].local_id)
        preparing.resolve({ ok: true, file: f, was_resized: false })
        await done
        expect(deps.upload).not.toHaveBeenCalled()
        expect(draft.items).toHaveLength(0)
    })

    it('un error de subida abortada (al limpiar) no se marca como error', async () => {
        const pending = deferred<ChatAttachment>()
        const { draft } = setup({ upload: vi.fn(() => pending.promise) })
        const done = draft.add([file('f.pdf', 'application/pdf')])
        draft.clear()
        pending.reject({ status: 0 })
        await done
        expect(draft.items).toHaveLength(0)
        expect(draft.has_errors).toBe(false)
    })

    it('clear deja la caja vacía tras enviar', async () => {
        const { draft } = setup()
        await draft.add([file('a.pdf', 'application/pdf'), file('b.jpg', 'image/jpeg')])
        expect(draft.ready).toHaveLength(2)
        draft.clear()
        expect(draft.items).toEqual([])
    })
})

describe('canSubmitMessage', () => {
    const base = {
        text: '',
        ready_count: 0,
        is_busy: false,
        has_errors: false,
        is_streaming: false,
        disabled: false
    }

    it('con texto → sí', () => {
        expect(canSubmitMessage({ ...base, text: 'hola' })).toBe(true)
    })

    it('solo con adjuntos listos (sin texto) → sí', () => {
        expect(canSubmitMessage({ ...base, ready_count: 1 })).toBe(true)
    })

    it('sin texto ni adjuntos (o solo espacios) → no', () => {
        expect(canSubmitMessage(base)).toBe(false)
        expect(canSubmitMessage({ ...base, text: '   ' })).toBe(false)
    })

    it.each([
        ['subiendo', { is_busy: true }],
        ['con un adjunto en error', { has_errors: true }],
        ['respondiendo', { is_streaming: true }],
        ['sin créditos (deshabilitado)', { disabled: true }]
    ])('%s → no', (_label, patch) => {
        expect(canSubmitMessage({ ...base, text: 'hola', ready_count: 1, ...patch })).toBe(false)
    })
})
