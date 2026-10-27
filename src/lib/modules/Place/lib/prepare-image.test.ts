import { describe, expect, it, vi } from 'vitest'
import { TOO_LARGE_MESSAGE } from './attachments'
import type { DecodedImage } from './image-canvas'
import { prepareImage, type PrepareImageDeps } from './prepare-image'

const MB = 1024 * 1024

/** Archivo de `size` bytes sin reservar memoria real. */
const fakeFile = (name: string, size: number, type = 'image/jpeg'): File => {
    const file = new File([new Uint8Array(1)], name, { type })
    Object.defineProperty(file, 'size', { value: size })
    return file
}

const decoded = (width: number, height: number) => {
    const close = vi.fn()
    const image: DecodedImage = { width, height, source: {} as CanvasImageSource, close }
    return { image, close }
}

const deps = (overrides: Partial<PrepareImageDeps> = {}): PrepareImageDeps => ({
    decode: vi.fn(async () => decoded(1200, 900).image),
    resize: vi.fn(async () => fakeFile('x.jpg', MB)),
    thumbnail: vi.fn(() => 'data:image/jpeg;base64,THUMB'),
    ...overrides
})

describe('prepareImage', () => {
    it('foto liviana y pequeña → original intacto + miniatura', async () => {
        const original = fakeFile('ticket.jpg', 2 * MB)
        const d = deps()
        const result = await prepareImage(original, d)
        expect(result).toEqual({
            ok: true,
            file: original,
            thumbnail_data_url: 'data:image/jpeg;base64,THUMB',
            was_resized: false
        })
        expect(d.resize).not.toHaveBeenCalled()
    })

    it('foto pesada (> 4 MB) → se sube la reducida', async () => {
        const original = fakeFile('ticket.jpg', 9 * MB)
        const reduced = fakeFile('ticket.jpg', 1.2 * MB)
        const d = deps({ resize: vi.fn(async () => reduced) })
        const result = await prepareImage(original, d)
        expect(result).toMatchObject({ ok: true, file: reduced, was_resized: true })
    })

    it('foto con lado > 2500 px aunque pese poco → se reduce', async () => {
        const original = fakeFile('ticket.jpg', 3 * MB)
        const reduced = fakeFile('ticket.jpg', MB)
        const d = deps({
            decode: vi.fn(async () => decoded(4032, 3024).image),
            resize: vi.fn(async () => reduced)
        })
        expect(await prepareImage(original, d)).toMatchObject({ file: reduced, was_resized: true })
    })

    it('foto de 20 MB que se logra reducir → cabe y se sube', async () => {
        const reduced = fakeFile('ticket.jpg', 2 * MB)
        const result = await prepareImage(fakeFile('ticket.jpg', 20 * MB), deps({ resize: vi.fn(async () => reduced) }))
        expect(result).toMatchObject({ ok: true, file: reduced })
    })

    it('si la reducción falla → sube el original si cabe en 15 MB', async () => {
        const original = fakeFile('ticket.jpg', 8 * MB)
        const result = await prepareImage(
            original,
            deps({ resize: vi.fn(async () => Promise.reject(new Error('canvas'))) })
        )
        expect(result).toMatchObject({ ok: true, file: original, was_resized: false })
    })

    it('si la reducción falla y el original pasa de 15 MB → error en español', async () => {
        const result = await prepareImage(
            fakeFile('ticket.jpg', 16 * MB),
            deps({ resize: vi.fn(async () => Promise.reject(new Error('canvas'))) })
        )
        expect(result).toEqual({ ok: false, error: TOO_LARGE_MESSAGE })
    })

    it('si la "reducida" sale más pesada → se queda el original', async () => {
        const original = fakeFile('ticket.jpg', 5 * MB)
        const result = await prepareImage(original, deps({ resize: vi.fn(async () => fakeFile('x.jpg', 6 * MB)) }))
        expect(result).toMatchObject({ file: original, was_resized: false })
    })

    it('no se puede decodificar (HEIC fuera de Safari) → original sin miniatura', async () => {
        const original = fakeFile('IMG.HEIC', 3 * MB, 'image/heic')
        const d = deps({ decode: vi.fn(async () => Promise.reject(new Error('heic'))) })
        const result = await prepareImage(original, d)
        expect(result).toEqual({ ok: true, file: original, was_resized: false })
        expect(d.resize).not.toHaveBeenCalled()
        expect(d.thumbnail).not.toHaveBeenCalled()
    })

    it('no se puede decodificar y pesa más de 15 MB → error', async () => {
        const result = await prepareImage(
            fakeFile('IMG.HEIC', 20 * MB, 'image/heic'),
            deps({ decode: vi.fn(async () => Promise.reject(new Error('heic'))) })
        )
        expect(result).toEqual({ ok: false, error: TOO_LARGE_MESSAGE })
    })

    it('si la miniatura falla → se sube igual, sin miniatura', async () => {
        const result = await prepareImage(
            fakeFile('ticket.jpg', MB),
            deps({
                thumbnail: vi.fn(() => {
                    throw new Error('canvas')
                })
            })
        )
        expect(result).toMatchObject({ ok: true })
        expect(result).not.toHaveProperty('thumbnail_data_url')
    })

    it('siempre libera la imagen decodificada (también si hay error)', async () => {
        const ok = decoded(1000, 800)
        await prepareImage(fakeFile('a.jpg', MB), deps({ decode: vi.fn(async () => ok.image) }))
        expect(ok.close).toHaveBeenCalledTimes(1)

        const fail = decoded(1000, 800)
        await prepareImage(
            fakeFile('a.jpg', 20 * MB),
            deps({ decode: vi.fn(async () => fail.image), resize: vi.fn(async () => Promise.reject(new Error('x'))) })
        )
        expect(fail.close).toHaveBeenCalledTimes(1)
    })
})
