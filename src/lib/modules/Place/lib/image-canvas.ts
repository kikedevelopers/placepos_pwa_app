import {
    RESIZED_JPEG_QUALITY,
    RESIZED_MAX_SIDE,
    THUMBNAIL_JPEG_QUALITY,
    THUMBNAIL_MAX_SIDE,
    computeScaledSize,
    resizedFileName
} from './attachments'

/**
 * Operaciones de imagen del NAVEGADOR (canvas). Sin lógica de negocio: las
 * decisiones (cuándo reducir, qué hacer si falla) viven en `prepare-image.ts`,
 * que recibe estas funciones inyectadas para poder probarlas sin DOM.
 *
 * HEIC: solo Safari lo decodifica; en otros navegadores `decode` lanza y el
 * llamador sube el original (el servidor sí lo acepta).
 */

export interface DecodedImage {
    width: number
    height: number
    source: CanvasImageSource
    close: () => void
}

export const decodeImage = async (file: Blob): Promise<DecodedImage> => {
    if (typeof createImageBitmap === 'function') {
        const bitmap = await createImageBitmap(file)
        return { width: bitmap.width, height: bitmap.height, source: bitmap, close: () => bitmap.close() }
    }
    const url = URL.createObjectURL(file)
    try {
        const image = new Image()
        image.decoding = 'async'
        image.src = url
        await image.decode()
        return {
            width: image.naturalWidth,
            height: image.naturalHeight,
            source: image,
            close: () => URL.revokeObjectURL(url)
        }
    } catch (error) {
        URL.revokeObjectURL(url)
        throw error
    }
}

const drawScaled = (image: DecodedImage, max_side: number): HTMLCanvasElement => {
    const size = computeScaledSize(image.width, image.height, max_side)
    if (size.width === 0 || size.height === 0) throw new Error('Imagen sin dimensiones')
    const canvas = document.createElement('canvas')
    canvas.width = size.width
    canvas.height = size.height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Canvas no disponible')
    // Fondo blanco: un PNG con transparencia no queda negro al pasar a JPEG.
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, size.width, size.height)
    context.drawImage(image.source, 0, 0, size.width, size.height)
    return canvas
}

/** Reduce la foto (lado mayor 2400 px, JPEG 0.85). Lanza si no se puede. */
export const resizeImage = async (file: File, image: DecodedImage): Promise<File> => {
    const canvas = drawScaled(image, RESIZED_MAX_SIDE)
    const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', RESIZED_JPEG_QUALITY)
    )
    if (!blob || blob.size === 0) throw new Error('No se pudo reducir la imagen')
    return new File([blob], resizedFileName(file.name), { type: 'image/jpeg', lastModified: Date.now() })
}

/** Miniatura ~160 px JPEG 0.6 como data URL (para el historial). */
export const createThumbnail = (image: DecodedImage): string =>
    drawScaled(image, THUMBNAIL_MAX_SIDE).toDataURL('image/jpeg', THUMBNAIL_JPEG_QUALITY)
