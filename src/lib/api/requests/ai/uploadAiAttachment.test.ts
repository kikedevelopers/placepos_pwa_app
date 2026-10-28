import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * `POST /ai/attachments`: el archivo tiene que viajar como multipart (sin
 * fijar Content-Type, ver uploadProductImage.test.ts) bajo el campo `file`, y
 * la respuesta se valida contra el contrato.
 */
const post = vi.fn()
vi.mock('$lib/api/config', () => ({ default: { post: (...args: unknown[]) => post(...args) } }))
vi.mock('$lib/api/storage', () => ({ getAuthToken: vi.fn(async () => null) }))
vi.mock('$lib/constants/env', () => ({ env: { apiBaseUrl: 'http://localhost:3800' } }))

const VALID = {
    id: '3f1c2b9e-0000-4000-8000-000000000001',
    file_name: 'factura.pdf',
    mime_type: 'application/pdf',
    size_bytes: 1234,
    expires_at: '2026-10-29T08:00:00.000Z'
}

const pdf = () => new File([new Uint8Array([0x25, 0x50, 0x44, 0x46])], 'factura.pdf', { type: 'application/pdf' })

describe('uploadAiAttachment', () => {
    beforeEach(() => {
        post.mockReset()
    })

    it('manda el archivo en el campo `file` sin fijar Content-Type y devuelve el adjunto', async () => {
        post.mockResolvedValue({ data: { success: true, payload: VALID } })
        const { uploadAiAttachment } = await import('./index')
        const controller = new AbortController()
        const file = pdf()

        const result = await uploadAiAttachment(file, controller.signal)

        expect(result).toEqual(VALID)
        const [url, body, config] = post.mock.calls[0]
        expect(url).toBe('/ai/attachments')
        expect(body).toBeInstanceOf(FormData)
        const sent = (body as FormData).get('file') as File
        expect(sent).toBeInstanceOf(File)
        expect(sent.name).toBe('factura.pdf')
        expect(config.headers).toEqual({ 'Content-Type': undefined })
        expect(config.signal).toBe(controller.signal)
        expect(config.timeout).toBeGreaterThan(15000)
    })

    it('respuesta fuera de contrato → lanza (no se agrega un adjunto sin id)', async () => {
        post.mockResolvedValue({ data: { success: true, payload: { ...VALID, id: '' } } })
        const { uploadAiAttachment } = await import('./index')
        await expect(uploadAiAttachment(pdf())).rejects.toMatchObject({ status: 500 })
    })

    it('sin payload → lanza', async () => {
        post.mockResolvedValue({ data: {} })
        const { uploadAiAttachment } = await import('./index')
        await expect(uploadAiAttachment(pdf())).rejects.toBeTruthy()
    })

    it('los errores HTTP del interceptor se propagan tal cual (413/422/403)', async () => {
        post.mockRejectedValue({ status: 413, error: 'Payload Too Large' })
        const { uploadAiAttachment } = await import('./index')
        await expect(uploadAiAttachment(pdf())).rejects.toEqual({ status: 413, error: 'Payload Too Large' })
    })
})
