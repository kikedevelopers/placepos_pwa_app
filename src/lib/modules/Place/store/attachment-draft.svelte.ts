import {
    TOO_MANY_MESSAGE,
    checkCandidate,
    describeUploadError,
    fitToLimit,
    type ChatAttachment
} from '$lib/modules/Place/lib/attachments'
import type { PreparedImage } from '$lib/modules/Place/lib/prepare-image'

/**
 * Adjuntos de la caja de texto de Place ANTES de enviar. Cada archivo se sube
 * apenas se elige (`POST /ai/attachments`, no gasta crédito): al enviar, el
 * mensaje solo lleva los ids. Estado por archivo:
 *   processing (reduciendo la foto) → uploading → ready | error (reintentar).
 *
 * Dependencias inyectadas (subida, preparación de fotos, avisos) para poder
 * probar todo el flujo sin red ni canvas.
 */

export type DraftStatus = 'processing' | 'uploading' | 'ready' | 'error'

export interface DraftAttachment {
    local_id: string
    file_name: string
    mime_type: string
    size_bytes: number
    status: DraftStatus
    error?: string
    thumbnail_data_url?: string
    /** Ya subido: lo que viaja en el mensaje. */
    attachment?: ChatAttachment
}

export interface AttachmentDraftDeps {
    upload: (file: File, signal: AbortSignal) => Promise<ChatAttachment>
    prepareImage: (file: File) => Promise<PreparedImage>
    /** Aviso de archivos rechazados (tipo, tamaño, cantidad). */
    notify: (message: string) => void
}

const local_uid = (): string =>
    typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`

export class AttachmentDraft {
    items = $state<DraftAttachment[]>([])
    private files = new Map<string, File>()
    private controllers = new Map<string, AbortController>()

    constructor(private deps: AttachmentDraftDeps) {}

    /** Algún archivo se está reduciendo o subiendo (no se puede enviar). */
    get is_busy(): boolean {
        return this.items.some((item) => item.status === 'processing' || item.status === 'uploading')
    }

    get has_errors(): boolean {
        return this.items.some((item) => item.status === 'error')
    }

    get ready(): ChatAttachment[] {
        return this.items
            .filter((item) => item.status === 'ready' && item.attachment)
            .map((item) => item.attachment as ChatAttachment)
    }

    /**
     * Agrega archivos elegidos, tomados con la cámara o pegados. Respeta el
     * máximo de 5 por mensaje y descarta (con aviso) los de tipo inválido.
     * Devuelve la promesa de todas las subidas (útil en tests).
     */
    add(incoming: readonly File[]): Promise<void> {
        const { accepted, rejected_count } = fitToLimit(incoming, this.items.length)
        if (rejected_count > 0) this.deps.notify(TOO_MANY_MESSAGE)

        const jobs: Promise<void>[] = []
        for (const file of accepted) {
            const check = checkCandidate(file)
            if (!check.ok) {
                this.deps.notify(`${file.name || 'Archivo'}: ${check.error}`)
                continue
            }
            const local_id = local_uid()
            this.items.push({
                local_id,
                file_name: file.name || 'archivo',
                mime_type: check.mime_type,
                size_bytes: file.size,
                status: check.is_image ? 'processing' : 'uploading'
            })
            jobs.push(this.process(local_id, file, check.is_image))
        }
        return Promise.all(jobs).then(() => undefined)
    }

    private find(local_id: string): DraftAttachment | undefined {
        return this.items.find((item) => item.local_id === local_id)
    }

    private async process(local_id: string, original: File, is_image: boolean): Promise<void> {
        let file = original
        if (is_image) {
            const prepared = await this.deps.prepareImage(original)
            const item = this.find(local_id)
            if (!item) return // lo quitaron mientras se reducía
            if (!prepared.ok) {
                item.status = 'error'
                item.error = prepared.error
                return
            }
            file = prepared.file
            item.size_bytes = file.size
            if (prepared.thumbnail_data_url) item.thumbnail_data_url = prepared.thumbnail_data_url
        }
        this.files.set(local_id, file)
        await this.upload(local_id)
    }

    private async upload(local_id: string): Promise<void> {
        const item = this.find(local_id)
        const file = this.files.get(local_id)
        if (!item || !file) return
        item.status = 'uploading'
        item.error = undefined

        const controller = new AbortController()
        this.controllers.set(local_id, controller)
        try {
            const uploaded = await this.deps.upload(file, controller.signal)
            const current = this.find(local_id)
            if (!current || controller.signal.aborted) return
            current.attachment = current.thumbnail_data_url
                ? { ...uploaded, thumbnail_data_url: current.thumbnail_data_url }
                : uploaded
            current.status = 'ready'
        } catch (error) {
            const current = this.find(local_id)
            if (!current || controller.signal.aborted) return
            current.status = 'error'
            current.error = describeUploadError(error)
        } finally {
            if (this.controllers.get(local_id) === controller) this.controllers.delete(local_id)
        }
    }

    /** Reintenta la subida de un archivo que falló (si se llegó a preparar). */
    retry(local_id: string): Promise<void> {
        const item = this.find(local_id)
        if (!item || item.status !== 'error' || !this.files.has(local_id)) return Promise.resolve()
        return this.upload(local_id)
    }

    /** ¿Se puede reintentar? (un error de tamaño/tipo no se arregla subiendo otra vez). */
    canRetry(local_id: string): boolean {
        const item = this.find(local_id)
        return !!item && item.status === 'error' && this.files.has(local_id)
    }

    remove(local_id: string): void {
        this.controllers.get(local_id)?.abort()
        this.controllers.delete(local_id)
        this.files.delete(local_id)
        this.items = this.items.filter((item) => item.local_id !== local_id)
    }

    /** Tras enviar: la caja queda vacía (los archivos ya viven en el servidor). */
    clear(): void {
        for (const controller of this.controllers.values()) controller.abort()
        this.controllers.clear()
        this.files.clear()
        this.items = []
    }
}

/**
 * ¿Se puede enviar? Texto o al menos un adjunto listo; nada subiendo ni con
 * error; sin stream en curso ni chat deshabilitado (sin créditos).
 */
export const canSubmitMessage = (input: {
    text: string
    ready_count: number
    is_busy: boolean
    has_errors: boolean
    is_streaming: boolean
    disabled: boolean
}): boolean =>
    !input.is_streaming &&
    !input.disabled &&
    !input.is_busy &&
    !input.has_errors &&
    (input.text.trim().length > 0 || input.ready_count > 0)
