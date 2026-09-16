import { describe, it, expect } from 'vitest'
import {
    buildImageHint,
    DEFAULT_IMAGE_SETTINGS,
    formatFileSize,
    formatFormatList,
    IMAGE_ACCEPT_ATTRIBUTE,
    resolveImageSrc,
    validateProductImageFile,
    type ProductImageSettings
} from './productImage'

/**
 * Validación de la imagen en el CLIENTE. Es una cortesía para que el usuario
 * vea el error al instante: la verificación que manda (bytes reales) vive en el
 * servidor. Lo que se fija aquí es que los mensajes y los límites salgan de la
 * configuración del servidor, nunca de números escritos a mano en la UI.
 */

const SETTINGS: ProductImageSettings = {
    enabled: true,
    max_size_mb: 2,
    recommended_width: 800,
    recommended_height: 800,
    accepted_formats: ['jpg', 'png', 'webp']
}

const MB = 1024 * 1024

describe('validateProductImageFile · aceptados', () => {
    it('acepta JPEG dentro del límite', () => {
        expect(validateProductImageFile({ type: 'image/jpeg', size: 500_000 }, SETTINGS)).toBeNull()
    })

    it('acepta PNG y WebP', () => {
        expect(validateProductImageFile({ type: 'image/png', size: 1000 }, SETTINGS)).toBeNull()
        expect(validateProductImageFile({ type: 'image/webp', size: 1000 }, SETTINGS)).toBeNull()
    })

    it('acepta un archivo EXACTAMENTE en el límite', () => {
        expect(validateProductImageFile({ type: 'image/jpeg', size: 2 * MB }, SETTINGS)).toBeNull()
    })
})

describe('validateProductImageFile · rechazados', () => {
    it('rechaza un formato no soportado (GIF)', () => {
        const error = validateProductImageFile({ type: 'image/gif', size: 1000 }, SETTINGS)
        expect(error?.code).toBe('INVALID_TYPE')
    })

    it('rechaza un PDF por más liviano que sea', () => {
        const error = validateProductImageFile({ type: 'application/pdf', size: 10 }, SETTINGS)
        expect(error?.code).toBe('INVALID_TYPE')
    })

    it('rechaza un archivo sin tipo (arrastrado desde un origen raro)', () => {
        const error = validateProductImageFile({ type: '', size: 1000 }, SETTINGS)
        expect(error?.code).toBe('INVALID_TYPE')
    })

    it('rechaza un byte por encima del límite', () => {
        const error = validateProductImageFile({ type: 'image/jpeg', size: 2 * MB + 1 }, SETTINGS)
        expect(error?.code).toBe('TOO_LARGE')
    })

    it('el mensaje del límite usa el tope QUE MANDA EL SERVIDOR, no uno fijo', () => {
        const error = validateProductImageFile(
            { type: 'image/jpeg', size: 6 * MB },
            { ...SETTINGS, max_size_mb: 5 }
        )
        expect(error?.message).toBe('La imagen supera el límite de 5 MB.')
    })

    it('el tipo se valida ANTES que el peso (un PDF enorme es "formato", no "peso")', () => {
        const error = validateProductImageFile({ type: 'application/pdf', size: 50 * MB }, SETTINGS)
        expect(error?.code).toBe('INVALID_TYPE')
    })

    it('sin settings usa los defaults del contrato (2 MB)', () => {
        expect(validateProductImageFile({ type: 'image/jpeg', size: 2 * MB })).toBeNull()
        expect(validateProductImageFile({ type: 'image/jpeg', size: 2 * MB + 1 })?.code).toBe(
            'TOO_LARGE'
        )
    })

    it('un límite con decimales se muestra sin redondear de más', () => {
        const error = validateProductImageFile(
            { type: 'image/jpeg', size: 2 * MB },
            { ...SETTINGS, max_size_mb: 1.5 }
        )
        expect(error?.message).toBe('La imagen supera el límite de 1.5 MB.')
    })
})

describe('buildImageHint · lo que se le promete al usuario', () => {
    it('incluye formatos, límite y dimensiones recomendadas', () => {
        expect(buildImageHint(SETTINGS)).toBe(
            'JPG, PNG o WebP · máx 2 MB · recomendado 800×800 px'
        )
    })

    it('refleja los valores del servidor cuando cambian', () => {
        expect(
            buildImageHint({
                ...SETTINGS,
                max_size_mb: 5,
                recommended_width: 1200,
                recommended_height: 900
            })
        ).toBe('JPG, PNG o WebP · máx 5 MB · recomendado 1200×900 px')
    })

    it('no rellena decimales en un límite entero', () => {
        expect(buildImageHint(SETTINGS)).toContain('máx 2 MB')
    })
})

describe('formatFormatList', () => {
    it('escribe WebP con su capitalización propia', () => {
        expect(formatFormatList(['jpg', 'png', 'webp'])).toBe('JPG, PNG o WebP')
    })

    it('con un solo formato no agrega conjunción', () => {
        expect(formatFormatList(['jpg'])).toBe('JPG')
    })

    it('con dos formatos usa "o"', () => {
        expect(formatFormatList(['jpg', 'png'])).toBe('JPG o PNG')
    })

    it('con la lista vacía devuelve cadena vacía', () => {
        expect(formatFormatList([])).toBe('')
    })
})

describe('formatFileSize', () => {
    it('bytes', () => {
        expect(formatFileSize(512)).toBe('512 B')
    })

    it('kilobytes redondeados', () => {
        expect(formatFileSize(250_000)).toBe('244 KB')
    })

    it('megabytes con un decimal', () => {
        expect(formatFileSize(1.5 * MB)).toBe('1.5 MB')
    })

    it('sin decimal de relleno cuando es exacto', () => {
        expect(formatFileSize(2 * MB)).toBe('2 MB')
    })
})

describe('constantes del input', () => {
    it('el atributo accept lista los MIME soportados', () => {
        expect(IMAGE_ACCEPT_ATTRIBUTE).toBe('image/jpeg,image/png,image/webp')
    })

    it('los defaults arrancan deshabilitados (hasta que el servidor confirme)', () => {
        // Así el campo no parpadea en pantalla en un servidor sin bucket.
        expect(DEFAULT_IMAGE_SETTINGS.enabled).toBe(false)
    })
})

describe('resolveImageSrc', () => {
    const API = 'https://foxpos.kikedevs.com'

    it('antepone la base del API a una ruta relativa del proxy', () => {
        expect(resolveImageSrc('/product-images/serve?o=x&e=1&s=sig', API)).toBe(
            'https://foxpos.kikedevs.com/product-images/serve?o=x&e=1&s=sig'
        )
    })

    it('no duplica la barra si la base termina en /', () => {
        expect(resolveImageSrc('/product-images/serve?o=x', 'https://api.test/')).toBe(
            'https://api.test/product-images/serve?o=x'
        )
    })

    it('deja intactas las URLs absolutas (firma antigua de GCS)', () => {
        const abs = 'https://storage.googleapis.com/bucket/inventory_items/1/2.jpg?sig=abc'
        expect(resolveImageSrc(abs, API)).toBe(abs)
    })

    it('deja intactos los blob: y data: (vistas previas locales)', () => {
        expect(resolveImageSrc('blob:app://uuid', API)).toBe('blob:app://uuid')
        expect(resolveImageSrc('data:image/png;base64,AAAA', API)).toBe('data:image/png;base64,AAAA')
    })

    it('null/undefined/"" → undefined (sin src)', () => {
        expect(resolveImageSrc(null, API)).toBeUndefined()
        expect(resolveImageSrc(undefined, API)).toBeUndefined()
        expect(resolveImageSrc('', API)).toBeUndefined()
    })
})
