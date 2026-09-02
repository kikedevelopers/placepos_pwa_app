/**
 * Reglas de la imagen de un item del inventario (base, presentación y combo).
 *
 * Los límites REALES los define el servidor y viajan en
 * `GET /inventory/image-settings`; aquí solo se validan antes de subir para que
 * el usuario reciba el error al instante en vez de después de mandar 5 MB por
 * la red. Los valores por defecto son el mismo contrato del backend y solo se
 * usan mientras la consulta responde.
 */

export interface ProductImageSettings {
    /** `false` = este servidor no guarda imágenes; el formulario oculta el campo. */
    enabled: boolean
    max_size_mb: number
    recommended_width: number
    recommended_height: number
    /** Extensiones aceptadas, sin punto: `['jpg', 'png', 'webp']`. */
    accepted_formats: string[]
}

/** Espejo de los defaults del backend (`product-images.config.ts`). */
export const DEFAULT_IMAGE_SETTINGS: ProductImageSettings = {
    enabled: false,
    max_size_mb: 2,
    recommended_width: 800,
    recommended_height: 800,
    accepted_formats: ['jpg', 'png', 'webp']
}

/** MIME types que el `<input type="file">` ofrece y que el backend acepta. */
export const ACCEPTED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

/** Valor del atributo `accept` del input, derivado de los MIME soportados. */
export const IMAGE_ACCEPT_ATTRIBUTE = ACCEPTED_IMAGE_MIME_TYPES.join(',')

export type ImageValidationError =
    | { code: 'INVALID_TYPE'; message: string }
    | { code: 'TOO_LARGE'; message: string }

/** Archivo mínimo que se valida. Tipado laxo para poder probarlo sin DOM. */
export interface ValidatableFile {
    type: string
    size: number
    name?: string
}

/**
 * Valida el archivo antes de subirlo. Devuelve `null` cuando está bien.
 *
 * Se comprueba el tipo declarado por el navegador, que basta como cortesía al
 * usuario: la verificación de verdad (los bytes reales del archivo) la hace el
 * servidor, porque un cliente puede mentir y este es el lado que no manda.
 */
export function validateProductImageFile(
    file: ValidatableFile,
    settings: ProductImageSettings = DEFAULT_IMAGE_SETTINGS
): ImageValidationError | null {
    if (!ACCEPTED_IMAGE_MIME_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_MIME_TYPES)[number])) {
        return {
            code: 'INVALID_TYPE',
            message: `Formato no soportado. Usa una imagen ${formatFormatList(settings.accepted_formats)}.`
        }
    }

    const maxBytes = settings.max_size_mb * 1024 * 1024
    if (file.size > maxBytes) {
        return {
            code: 'TOO_LARGE',
            message: `La imagen supera el límite de ${trimNumber(settings.max_size_mb)} MB.`
        }
    }

    return null
}

/**
 * Texto de ayuda bajo el cuadro de imagen. Un solo lugar para que el límite y
 * las dimensiones que se le prometen al usuario salgan SIEMPRE de lo que el
 * servidor aplica de verdad.
 */
export function buildImageHint(settings: ProductImageSettings = DEFAULT_IMAGE_SETTINGS): string {
    const formats = formatFormatList(settings.accepted_formats)
    return (
        `${formats} · máx ${trimNumber(settings.max_size_mb)} MB · ` +
        `recomendado ${settings.recommended_width}×${settings.recommended_height} px`
    )
}

/** `['jpg','png','webp']` → `"JPG, PNG o WebP"`. */
export function formatFormatList(formats: string[]): string {
    const pretty = formats.map((format) => (format === 'webp' ? 'WebP' : format.toUpperCase()))
    if (pretty.length === 0) return ''
    if (pretty.length === 1) return pretty[0]
    return `${pretty.slice(0, -1).join(', ')} o ${pretty[pretty.length - 1]}`
}

/** Peso legible para el usuario: 245 KB, 1,4 MB. */
export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
    return `${trimNumber(Number((bytes / (1024 * 1024)).toFixed(1)))} MB`
}

/** Quita los decimales de relleno: 2 en vez de 2.0, pero conserva 1.5. */
function trimNumber(value: number): string {
    return String(Number(value.toFixed(2)))
}
