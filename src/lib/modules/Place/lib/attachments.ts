/**
 * Adjuntos de Place (fotos y PDF de facturas). Lógica PURA: validación,
 * decisión de reducir una foto, tamaños, vencimiento, validación de la
 * respuesta del servidor y de lo guardado en localStorage. Lo que toca el
 * canvas vive en `image-canvas.ts` y la orquestación en `attachment-draft`.
 *
 * Contrato con pos_api: `POST /ai/attachments` (multipart, campo `file`) sube
 * el archivo y devuelve su `id`; luego cada turno de `/ai/chat` manda sus
 * `attachment_ids`. Los adjuntos viven 47 h en el servidor; en el cliente solo
 * se guarda la metadata y una miniatura, NUNCA el archivo.
 */

export const IMAGE_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif'
] as const

export const PDF_MIME_TYPE = 'application/pdf'

export const ALLOWED_MIME_TYPES: readonly string[] = [...IMAGE_MIME_TYPES, PDF_MIME_TYPE]

/** `accept` del selector de archivos ("Elegir archivo"). */
export const FILE_PICKER_ACCEPT = ALLOWED_MIME_TYPES.join(',')

/** Límite del servidor por archivo. */
export const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024

/** Máximo de adjuntos por mensaje (lo mismo valida el servidor por turno). */
export const MAX_ATTACHMENTS_PER_MESSAGE = 5

/** A partir de aquí una foto se reduce en el cliente antes de subirla. */
export const RESIZE_THRESHOLD_BYTES = 4 * 1024 * 1024
export const RESIZE_THRESHOLD_SIDE = 2500

/** Lado mayor y calidad de la foto reducida. */
export const RESIZED_MAX_SIDE = 2400
export const RESIZED_JPEG_QUALITY = 0.85

/** Miniatura que se guarda en el historial (localStorage). */
export const THUMBNAIL_MAX_SIDE = 160
export const THUMBNAIL_JPEG_QUALITY = 0.6

/** Adjunto ya subido, tal como se guarda en el mensaje del usuario. */
export interface ChatAttachment {
    id: string
    file_name: string
    mime_type: string
    size_bytes: number
    expires_at: string
    /** Miniatura jpeg (data URL) generada en el cliente; solo imágenes. */
    thumbnail_data_url?: string
}

/** Lo mínimo de un `File` que necesita la validación (testeable sin DOM). */
export interface FileLike {
    name: string
    type: string
    size: number
}

const EXTENSION_MIME: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    heic: 'image/heic',
    heif: 'image/heif',
    pdf: PDF_MIME_TYPE
}

/**
 * Tipo real del archivo. Algunos navegadores entregan HEIC (fotos de iPhone)
 * con `type` vacío o `application/octet-stream`: entonces se deduce de la
 * extensión. `null` si no se reconoce.
 */
export const resolveMimeType = (file: Pick<FileLike, 'name' | 'type'>): string | null => {
    const type = (file.type ?? '').trim().toLowerCase()
    if (type === 'image/jpg') return 'image/jpeg'
    if (ALLOWED_MIME_TYPES.includes(type)) return type
    if (type.length > 0 && type !== 'application/octet-stream') return null
    const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
    return file.name.includes('.') ? (EXTENSION_MIME[extension] ?? null) : null
}

export const isImageMime = (mime_type: string): boolean =>
    (IMAGE_MIME_TYPES as readonly string[]).includes(mime_type)

export const isPdfMime = (mime_type: string): boolean => mime_type === PDF_MIME_TYPE

/** "2,4 MB" / "830 KB" / "512 B". */
export const formatFileSize = (bytes: number): string => {
    if (!Number.isFinite(bytes) || bytes < 0) return '—'
    if (bytes < 1024) return `${Math.round(bytes)} B`
    const format = (value: number) =>
        new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 }).format(value)
    if (bytes < 1024 * 1024) return `${format(bytes / 1024)} KB`
    return `${format(bytes / (1024 * 1024))} MB`
}

export const TOO_MANY_MESSAGE = `Puedes adjuntar máximo ${MAX_ATTACHMENTS_PER_MESSAGE} archivos por mensaje.`
export const INVALID_TYPE_MESSAGE = 'Solo se admiten fotos (JPG, PNG, WEBP, HEIC) o PDF.'
export const TOO_LARGE_MESSAGE = 'El archivo supera el máximo de 15 MB.'
export const EMPTY_FILE_MESSAGE = 'El archivo está vacío.'

export type CandidateCheck =
    | { ok: true; mime_type: string; is_image: boolean }
    | { ok: false; error: string }

/**
 * Validación antes de procesar un archivo elegido. Una FOTO de más de 15 MB
 * todavía se acepta aquí porque se intenta reducir; su tamaño final se revisa
 * con `checkFinalSize`. Un PDF no se reduce: tiene que caber desde ya.
 */
export const checkCandidate = (file: FileLike): CandidateCheck => {
    const mime_type = resolveMimeType(file)
    if (!mime_type) return { ok: false, error: INVALID_TYPE_MESSAGE }
    if (!Number.isFinite(file.size) || file.size <= 0) return { ok: false, error: EMPTY_FILE_MESSAGE }
    const is_image = isImageMime(mime_type)
    if (!is_image && file.size > MAX_ATTACHMENT_BYTES) return { ok: false, error: TOO_LARGE_MESSAGE }
    return { ok: true, mime_type, is_image }
}

/** Tamaño final (ya reducido, si aplicó) contra el límite del servidor. */
export const checkFinalSize = (size_bytes: number): string | null =>
    size_bytes > MAX_ATTACHMENT_BYTES ? TOO_LARGE_MESSAGE : null

/**
 * Cuántos de los archivos elegidos caben (máx 5 por mensaje contando los que
 * ya están en la caja) y si sobró alguno.
 */
export const fitToLimit = <T>(
    incoming: readonly T[],
    current_count: number
): { accepted: T[]; rejected_count: number } => {
    const room = Math.max(0, MAX_ATTACHMENTS_PER_MESSAGE - current_count)
    return { accepted: incoming.slice(0, room), rejected_count: Math.max(0, incoming.length - room) }
}

/** ¿Hay que reducir esta foto? (pesada o con un lado muy grande). */
export const shouldResizeImage = (input: {
    size_bytes: number
    width: number
    height: number
}): boolean =>
    input.size_bytes > RESIZE_THRESHOLD_BYTES ||
    Math.max(input.width, input.height) > RESIZE_THRESHOLD_SIDE

/** Dimensiones escaladas para que el lado mayor no pase de `max_side`. */
export const computeScaledSize = (
    width: number,
    height: number,
    max_side: number
): { width: number; height: number } => {
    if (!(width > 0) || !(height > 0)) return { width: 0, height: 0 }
    const longest = Math.max(width, height)
    if (longest <= max_side) return { width: Math.round(width), height: Math.round(height) }
    const ratio = max_side / longest
    return {
        width: Math.max(1, Math.round(width * ratio)),
        height: Math.max(1, Math.round(height * ratio))
    }
}

/** Nombre del archivo reducido: misma base, extensión `.jpg`. */
export const resizedFileName = (name: string): string => {
    const dot = name.lastIndexOf('.')
    const base = dot > 0 ? name.slice(0, dot) : name || 'foto'
    return `${base}.jpg`
}

/** ¿Venció en el servidor? (fecha inválida = se trata como vencida). */
export const isAttachmentExpired = (expires_at: string, now: number = Date.now()): boolean => {
    const time = Date.parse(expires_at)
    return !Number.isFinite(time) || time <= now
}

const isNonEmptyText = (value: unknown): value is string =>
    typeof value === 'string' && value.trim().length > 0

const isValidDate = (value: unknown): value is string =>
    typeof value === 'string' && Number.isFinite(Date.parse(value))

/**
 * Valida la respuesta de `POST /ai/attachments`. `null` si no cumple el
 * contrato: un adjunto sin id no puede viajar en el chat.
 */
export const parseUploadedAttachment = (raw: unknown): ChatAttachment | null => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
    const data = raw as Record<string, unknown>
    if (
        !isNonEmptyText(data.id) ||
        typeof data.file_name !== 'string' ||
        !isNonEmptyText(data.mime_type) ||
        typeof data.size_bytes !== 'number' ||
        !Number.isFinite(data.size_bytes) ||
        data.size_bytes < 0 ||
        !isValidDate(data.expires_at)
    ) {
        return null
    }
    const attachment: ChatAttachment = {
        id: data.id,
        file_name: data.file_name,
        mime_type: data.mime_type,
        size_bytes: data.size_bytes,
        expires_at: data.expires_at
    }
    if (typeof data.thumbnail_data_url === 'string' && data.thumbnail_data_url.startsWith('data:image/')) {
        attachment.thumbnail_data_url = data.thumbnail_data_url
    }
    return attachment
}

/**
 * Adjuntos guardados en un mensaje del historial. Historial antiguo (sin el
 * campo) → `undefined`; los corruptos se descartan sin romper el resto.
 */
export const parseStoredAttachments = (raw: unknown): ChatAttachment[] | undefined => {
    if (!Array.isArray(raw)) return undefined
    const list = raw
        .map(parseUploadedAttachment)
        .filter((item): item is ChatAttachment => item !== null)
    return list.length > 0 ? list : undefined
}

/** Mensaje en español para un error de `POST /ai/attachments`. */
export const describeUploadError = (error: unknown): string => {
    const e = (error && typeof error === 'object' ? error : {}) as {
        status?: unknown
        error?: unknown
        message?: unknown
        payload?: { code?: unknown; message?: unknown }
        code?: unknown
    }
    const code = e.payload?.code ?? e.code
    if (code === 'AI_NOT_ENABLED' || e.status === 403) return 'Tu cuenta no tiene habilitado el asistente.'
    if (e.status === 413) return TOO_LARGE_MESSAGE
    if (e.status === 422) return INVALID_TYPE_MESSAGE
    if (e.status === 401) return 'Tu sesión expiró. Vuelve a iniciar sesión.'
    if (e.status === 402) return 'Tu suscripción está vencida. Renuévala para usar la IA.'
    if (e.status === 503) return 'No hay conexión con el servidor. Revisa tu internet e intenta de nuevo.'
    return 'No se pudo subir el archivo. Intenta de nuevo.'
}

/** Solo las imágenes del portapapeles (pegar una captura en escritorio). */
export const pickPastedFiles = <T extends { type: string }>(files: readonly T[]): T[] =>
    files.filter((file) => file.type.startsWith('image/'))

/** Turno que viaja a `/ai/chat`. */
export interface ChatTurn {
    role: 'user' | 'assistant'
    content: string
    attachment_ids?: string[]
}

/** Lo que `buildChatTurns` necesita de un mensaje. */
export interface TurnSource {
    role: 'user' | 'assistant'
    content: string
    is_streaming?: boolean
    is_error?: boolean
    cards?: readonly unknown[]
    attachments?: readonly Pick<ChatAttachment, 'id'>[]
}

/**
 * Historial → turnos de `/ai/chat`:
 *   - fuera los mensajes a medio escribir y los de error;
 *   - un turno de Place con solo la tarjeta se manda como `card_only_turn`
 *     (sin él, el "sí" siguiente no respondería a ninguna vista previa);
 *   - CADA turno del usuario con adjuntos lleva sus `attachment_ids` en todas
 *     las peticiones (si vencieron, el servidor se lo dice al modelo); un
 *     turno así puede ir con `content` vacío;
 *   - los turnos sin texto ni adjuntos se descartan.
 */
export const buildChatTurns = (
    messages: readonly TurnSource[],
    card_only_turn: string
): ChatTurn[] => {
    const turns: ChatTurn[] = []
    for (const message of messages) {
        if (message.is_streaming || message.is_error) continue
        const is_card_only =
            message.role === 'assistant' &&
            message.content.trim().length === 0 &&
            (message.cards?.length ?? 0) > 0
        const content = is_card_only ? card_only_turn : message.content
        const attachment_ids =
            message.role === 'user'
                ? (message.attachments ?? [])
                      .map((attachment) => attachment.id)
                      .filter((id) => typeof id === 'string' && id.length > 0)
                      .slice(0, MAX_ATTACHMENTS_PER_MESSAGE)
                : []
        if (content.trim().length === 0 && attachment_ids.length === 0) continue
        turns.push(attachment_ids.length > 0 ? { role: message.role, content, attachment_ids } : { role: message.role, content })
    }
    return turns
}
