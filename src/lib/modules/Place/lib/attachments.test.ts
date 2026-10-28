import { describe, expect, it } from 'vitest'
import {
    EMPTY_FILE_MESSAGE,
    FILE_PICKER_ACCEPT,
    INVALID_TYPE_MESSAGE,
    MAX_ATTACHMENT_BYTES,
    TOO_LARGE_MESSAGE,
    buildChatTurns,
    checkCandidate,
    checkFinalSize,
    computeScaledSize,
    describeUploadError,
    fitToLimit,
    formatFileSize,
    isAttachmentExpired,
    parseStoredAttachments,
    parseUploadedAttachment,
    pickPastedFiles,
    resizedFileName,
    resolveMimeType,
    shouldResizeImage,
    type TurnSource
} from './attachments'

const MB = 1024 * 1024

const UPLOADED = {
    id: '3f1c2b9e-0000-4000-8000-000000000001',
    file_name: 'factura.jpg',
    mime_type: 'image/jpeg',
    size_bytes: 820_000,
    expires_at: '2026-10-29T08:00:00.000Z'
}

describe('resolveMimeType', () => {
    it.each([
        ['foto.jpg', 'image/jpeg', 'image/jpeg'],
        ['foto.jpg', 'image/jpg', 'image/jpeg'],
        ['captura.png', 'image/png', 'image/png'],
        ['x.webp', 'image/webp', 'image/webp'],
        ['IMG_1.HEIC', 'image/heic', 'image/heic'],
        ['x.heif', 'image/heif', 'image/heif'],
        ['factura.pdf', 'application/pdf', 'application/pdf'],
        ['FACTURA.PDF', 'APPLICATION/PDF', 'application/pdf']
    ])('%s (%s) → %s', (name, type, expected) => {
        expect(resolveMimeType({ name, type })).toBe(expected)
    })

    it('HEIC de iPhone sin tipo o como octet-stream → se deduce de la extensión', () => {
        expect(resolveMimeType({ name: 'IMG_0001.HEIC', type: '' })).toBe('image/heic')
        expect(resolveMimeType({ name: 'doc.pdf', type: 'application/octet-stream' })).toBe('application/pdf')
    })

    it.each([
        ['video.mp4', 'video/mp4'],
        ['hoja.xlsx', 'application/vnd.ms-excel'],
        ['icono.gif', 'image/gif'],
        ['sin-extension', ''],
        ['malware.exe', 'application/octet-stream'],
        // El tipo declarado manda: un .pdf declarado como texto no pasa.
        ['truco.pdf', 'text/plain']
    ])('%s (%s) → no se admite', (name, type) => {
        expect(resolveMimeType({ name, type })).toBeNull()
    })

    it('el accept del selector lista exactamente los tipos admitidos', () => {
        expect(FILE_PICKER_ACCEPT).toBe(
            'image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf'
        )
    })
})

describe('checkCandidate', () => {
    it('foto válida → imagen', () => {
        expect(checkCandidate({ name: 'a.jpg', type: 'image/jpeg', size: 2 * MB })).toEqual({
            ok: true,
            mime_type: 'image/jpeg',
            is_image: true
        })
    })

    it('PDF válido → no es imagen', () => {
        expect(checkCandidate({ name: 'f.pdf', type: 'application/pdf', size: MB })).toEqual({
            ok: true,
            mime_type: 'application/pdf',
            is_image: false
        })
    })

    it('una FOTO de más de 15 MB todavía se acepta (se intentará reducir)', () => {
        expect(checkCandidate({ name: 'a.jpg', type: 'image/jpeg', size: 30 * MB }).ok).toBe(true)
    })

    it('un PDF de más de 15 MB se rechaza de una vez (no se reduce)', () => {
        expect(checkCandidate({ name: 'f.pdf', type: 'application/pdf', size: MAX_ATTACHMENT_BYTES + 1 })).toEqual({
            ok: false,
            error: TOO_LARGE_MESSAGE
        })
    })

    it('un PDF de exactamente 15 MB entra', () => {
        expect(checkCandidate({ name: 'f.pdf', type: 'application/pdf', size: MAX_ATTACHMENT_BYTES }).ok).toBe(true)
    })

    it('tipo inválido', () => {
        expect(checkCandidate({ name: 'v.mp4', type: 'video/mp4', size: 10 })).toEqual({
            ok: false,
            error: INVALID_TYPE_MESSAGE
        })
    })

    it.each([0, -1, Number.NaN])('tamaño %p → archivo vacío', (size) => {
        expect(checkCandidate({ name: 'a.jpg', type: 'image/jpeg', size })).toEqual({
            ok: false,
            error: EMPTY_FILE_MESSAGE
        })
    })
})

describe('checkFinalSize', () => {
    it('cabe en 15 MB → sin error; un byte más → error', () => {
        expect(checkFinalSize(MAX_ATTACHMENT_BYTES)).toBeNull()
        expect(checkFinalSize(MAX_ATTACHMENT_BYTES + 1)).toBe(TOO_LARGE_MESSAGE)
    })
})

describe('fitToLimit (máx 5 por mensaje)', () => {
    it('caja vacía y 3 archivos → entran los 3', () => {
        expect(fitToLimit([1, 2, 3], 0)).toEqual({ accepted: [1, 2, 3], rejected_count: 0 })
    })

    it('ya hay 3 y llegan 4 → entran 2, sobran 2', () => {
        expect(fitToLimit([1, 2, 3, 4], 3)).toEqual({ accepted: [1, 2], rejected_count: 2 })
    })

    it('caja llena → no entra ninguno', () => {
        expect(fitToLimit([1], 5)).toEqual({ accepted: [], rejected_count: 1 })
    })

    it('conteo actual por encima del máximo no da negativos', () => {
        expect(fitToLimit([1, 2], 9)).toEqual({ accepted: [], rejected_count: 2 })
    })
})

describe('shouldResizeImage', () => {
    it('liviana y pequeña → no se toca', () => {
        expect(shouldResizeImage({ size_bytes: 3 * MB, width: 2000, height: 1500 })).toBe(false)
    })

    it('justo en los umbrales (4 MB y 2500 px) → no se toca', () => {
        expect(shouldResizeImage({ size_bytes: 4 * MB, width: 2500, height: 2500 })).toBe(false)
    })

    it('más de 4 MB → se reduce', () => {
        expect(shouldResizeImage({ size_bytes: 4 * MB + 1, width: 1000, height: 800 })).toBe(true)
    })

    it('un lado de más de 2500 px (vertical u horizontal) → se reduce', () => {
        expect(shouldResizeImage({ size_bytes: MB, width: 4032, height: 3024 })).toBe(true)
        expect(shouldResizeImage({ size_bytes: MB, width: 1200, height: 2501 })).toBe(true)
    })
})

describe('computeScaledSize', () => {
    it('lado mayor a 2400 conservando la proporción', () => {
        expect(computeScaledSize(4032, 3024, 2400)).toEqual({ width: 2400, height: 1800 })
        expect(computeScaledSize(3024, 4032, 2400)).toEqual({ width: 1800, height: 2400 })
    })

    it('ya cabe → no se agranda', () => {
        expect(computeScaledSize(800, 600, 2400)).toEqual({ width: 800, height: 600 })
    })

    it('miniatura de 160 px', () => {
        expect(computeScaledSize(4000, 1000, 160)).toEqual({ width: 160, height: 40 })
    })

    it('imagen extremadamente alargada nunca da 0 px', () => {
        expect(computeScaledSize(10000, 1, 160)).toEqual({ width: 160, height: 1 })
    })

    it.each([
        [0, 100],
        [100, 0],
        [-5, 10],
        [Number.NaN, 10]
    ])('dimensiones inválidas %p×%p → 0×0', (width, height) => {
        expect(computeScaledSize(width, height, 2400)).toEqual({ width: 0, height: 0 })
    })
})

describe('resizedFileName', () => {
    it.each([
        ['IMG_0001.HEIC', 'IMG_0001.jpg'],
        ['factura.final.png', 'factura.final.jpg'],
        ['sin-extension', 'sin-extension.jpg'],
        ['.oculto', '.oculto.jpg'],
        ['', 'foto.jpg']
    ])('%p → %p', (input, expected) => {
        expect(resizedFileName(input)).toBe(expected)
    })
})

describe('isAttachmentExpired', () => {
    const now = Date.parse('2026-10-27T12:00:00.000Z')

    it('vence en el futuro → vigente', () => {
        expect(isAttachmentExpired('2026-10-28T12:00:00.000Z', now)).toBe(false)
    })

    it('ya pasó o vence justo ahora → vencido', () => {
        expect(isAttachmentExpired('2026-10-27T11:59:59.000Z', now)).toBe(true)
        expect(isAttachmentExpired('2026-10-27T12:00:00.000Z', now)).toBe(true)
    })

    it('fecha inválida → se trata como vencido', () => {
        expect(isAttachmentExpired('mañana', now)).toBe(true)
    })
})

describe('formatFileSize', () => {
    it.each([
        [512, '512 B'],
        [2048, '2 KB'],
        [1536, '1,5 KB'],
        [2.4 * MB, '2,4 MB'],
        [15 * MB, '15 MB']
    ])('%p bytes → %p', (bytes, expected) => {
        expect(formatFileSize(bytes)).toBe(expected)
    })

    it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])('%p → guion', (bytes) => {
        expect(formatFileSize(bytes)).toBe('—')
    })
})

describe('parseUploadedAttachment (respuesta de POST /ai/attachments)', () => {
    it('respuesta válida → adjunto', () => {
        expect(parseUploadedAttachment(UPLOADED)).toEqual(UPLOADED)
    })

    it('conserva una miniatura data:image guardada; descarta otra cosa', () => {
        expect(
            parseUploadedAttachment({ ...UPLOADED, thumbnail_data_url: 'data:image/jpeg;base64,AAA' })
        ).toMatchObject({ thumbnail_data_url: 'data:image/jpeg;base64,AAA' })
        expect(
            parseUploadedAttachment({ ...UPLOADED, thumbnail_data_url: 'javascript:alert(1)' })
        ).not.toHaveProperty('thumbnail_data_url')
    })

    it.each([
        ['null', null],
        ['arreglo', [UPLOADED]],
        ['sin id', { ...UPLOADED, id: '' }],
        ['id numérico', { ...UPLOADED, id: 7 }],
        ['sin nombre', { ...UPLOADED, file_name: undefined }],
        ['sin tipo', { ...UPLOADED, mime_type: '' }],
        ['tamaño como texto', { ...UPLOADED, size_bytes: '820000' }],
        ['tamaño negativo', { ...UPLOADED, size_bytes: -1 }],
        ['tamaño NaN', { ...UPLOADED, size_bytes: Number.NaN }],
        ['vencimiento inválido', { ...UPLOADED, expires_at: 'pronto' }],
        ['sin vencimiento', { ...UPLOADED, expires_at: undefined }]
    ])('%s → null', (_label, raw) => {
        expect(parseUploadedAttachment(raw)).toBeNull()
    })
})

describe('parseStoredAttachments (historial en localStorage)', () => {
    it('historial anterior a los adjuntos (sin el campo) → undefined', () => {
        expect(parseStoredAttachments(undefined)).toBeUndefined()
        expect(parseStoredAttachments('basura')).toBeUndefined()
    })

    it('descarta los corruptos y conserva los buenos', () => {
        expect(parseStoredAttachments([UPLOADED, { id: 'x' }])).toEqual([UPLOADED])
    })

    it('todos corruptos o lista vacía → undefined', () => {
        expect(parseStoredAttachments([{ id: 'x' }])).toBeUndefined()
        expect(parseStoredAttachments([])).toBeUndefined()
    })
})

describe('describeUploadError', () => {
    it.each([
        [{ status: 413 }, TOO_LARGE_MESSAGE],
        [{ status: 422 }, INVALID_TYPE_MESSAGE],
        [{ status: 403 }, 'Tu cuenta no tiene habilitado el asistente.'],
        [{ status: 400, payload: { code: 'AI_NOT_ENABLED' } }, 'Tu cuenta no tiene habilitado el asistente.'],
        [{ status: 401 }, 'Tu sesión expiró. Vuelve a iniciar sesión.'],
        [{ status: 402 }, 'Tu suscripción está vencida. Renuévala para usar la IA.'],
        [{ status: 503 }, 'No hay conexión con el servidor. Revisa tu internet e intenta de nuevo.'],
        [{ status: 500 }, 'No se pudo subir el archivo. Intenta de nuevo.'],
        [new Error('boom'), 'No se pudo subir el archivo. Intenta de nuevo.'],
        [null, 'No se pudo subir el archivo. Intenta de nuevo.']
    ])('%j → %s', (error, expected) => {
        expect(describeUploadError(error)).toBe(expected)
    })
})

describe('pickPastedFiles', () => {
    it('solo las imágenes del portapapeles', () => {
        const files = [
            { type: 'image/png', name: 'captura.png' },
            { type: 'text/plain', name: 'nota.txt' },
            { type: 'application/pdf', name: 'f.pdf' }
        ]
        expect(pickPastedFiles(files)).toEqual([files[0]])
        expect(pickPastedFiles([])).toEqual([])
    })
})

describe('buildChatTurns', () => {
    const CARD_ONLY = '(tarjeta)'
    const ref = (id: string) => ({ id })

    it('turnos de texto sin adjuntos → sin attachment_ids (compatibilidad)', () => {
        const messages: TurnSource[] = [
            { role: 'user', content: 'hola' },
            { role: 'assistant', content: 'hola, ¿en qué te ayudo?' }
        ]
        const turns = buildChatTurns(messages, CARD_ONLY)
        expect(turns).toEqual([
            { role: 'user', content: 'hola' },
            { role: 'assistant', content: 'hola, ¿en qué te ayudo?' }
        ])
        expect(turns[0]).not.toHaveProperty('attachment_ids')
    })

    it('un turno solo con adjuntos viaja con content vacío y sus ids', () => {
        expect(buildChatTurns([{ role: 'user', content: '', attachments: [ref('a'), ref('b')] }], CARD_ONLY)).toEqual([
            { role: 'user', content: '', attachment_ids: ['a', 'b'] }
        ])
    })

    it('los ids de TODOS los turnos del historial viajan en cada petición', () => {
        const messages: TurnSource[] = [
            { role: 'user', content: 'mira esta factura', attachments: [ref('a')] },
            { role: 'assistant', content: 'Listo.' },
            { role: 'user', content: 'y esta otra', attachments: [ref('b')] },
            { role: 'assistant', content: '', is_streaming: true }
        ]
        expect(buildChatTurns(messages, CARD_ONLY)).toEqual([
            { role: 'user', content: 'mira esta factura', attachment_ids: ['a'] },
            { role: 'assistant', content: 'Listo.' },
            { role: 'user', content: 'y esta otra', attachment_ids: ['b'] }
        ])
    })

    it('máximo 5 ids por turno y sin ids vacíos', () => {
        const turns = buildChatTurns(
            [{ role: 'user', content: 'x', attachments: ['1', '', '2', '3', '4', '5', '6'].map(ref) }],
            CARD_ONLY
        )
        expect(turns[0].attachment_ids).toEqual(['1', '2', '3', '4', '5'])
    })

    it('el asistente nunca manda attachment_ids', () => {
        const turns = buildChatTurns(
            [{ role: 'assistant', content: 'ok', attachments: [ref('z')] }],
            CARD_ONLY
        )
        expect(turns).toEqual([{ role: 'assistant', content: 'ok' }])
    })

    it('turno de Place con solo la tarjeta → texto de tarjeta', () => {
        expect(
            buildChatTurns([{ role: 'assistant', content: '  ', cards: [{ kind: 'purchase_preview' }] }], CARD_ONLY)
        ).toEqual([{ role: 'assistant', content: CARD_ONLY }])
    })

    it('fuera los de error, los que se están escribiendo y los vacíos sin adjuntos', () => {
        expect(
            buildChatTurns(
                [
                    { role: 'user', content: 'hola' },
                    { role: 'assistant', content: 'falló', is_error: true },
                    { role: 'user', content: '   ' },
                    { role: 'user', content: '', attachments: [] },
                    { role: 'assistant', content: 'escribiendo', is_streaming: true }
                ],
                CARD_ONLY
            )
        ).toEqual([{ role: 'user', content: 'hola' }])
    })
})
