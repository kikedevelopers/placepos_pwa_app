import { checkFinalSize, shouldResizeImage } from './attachments'
import type { DecodedImage } from './image-canvas'

/**
 * Prepara una FOTO para subirla a Place:
 *   1. la decodifica (si no se puede —p. ej. HEIC fuera de Safari— sigue con
 *      el original, sin miniatura);
 *   2. si pesa > 4 MB o un lado pasa de 2500 px, la reduce (2400 px, JPEG 0.85);
 *   3. si la reducción falla o sale más pesada, usa el original;
 *   4. el resultado tiene que caber en 15 MB, si no → error en español.
 *
 * Las operaciones de canvas se inyectan para probar cada rama sin DOM.
 */

export interface PrepareImageDeps {
    decode: (file: File) => Promise<DecodedImage>
    resize: (file: File, image: DecodedImage) => Promise<File>
    thumbnail: (image: DecodedImage) => string
}

export type PreparedImage =
    | { ok: true; file: File; thumbnail_data_url?: string; was_resized: boolean }
    | { ok: false; error: string }

export const prepareImage = async (file: File, deps: PrepareImageDeps): Promise<PreparedImage> => {
    let image: DecodedImage | null = null
    try {
        image = await deps.decode(file)
    } catch {
        image = null
    }

    try {
        let output = file
        let was_resized = false
        if (image && shouldResizeImage({ size_bytes: file.size, width: image.width, height: image.height })) {
            try {
                const resized = await deps.resize(file, image)
                if (resized.size > 0 && resized.size < file.size) {
                    output = resized
                    was_resized = true
                }
            } catch {
                /* se sube el original si cabe */
            }
        }

        const size_error = checkFinalSize(output.size)
        if (size_error) return { ok: false, error: size_error }

        let thumbnail_data_url: string | undefined
        if (image) {
            try {
                thumbnail_data_url = deps.thumbnail(image)
            } catch {
                thumbnail_data_url = undefined
            }
        }
        return thumbnail_data_url
            ? { ok: true, file: output, thumbnail_data_url, was_resized }
            : { ok: true, file: output, was_resized }
    } finally {
        image?.close()
    }
}
