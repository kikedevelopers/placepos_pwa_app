import { fromStore } from 'svelte/store'
import { createQuery, useQueryClient } from '@tanstack/svelte-query'
import {
    getProductImageSettings,
    removeProductImage,
    uploadProductImage
} from '$lib/api/requests/products'
import { DEFAULT_IMAGE_SETTINGS, type ProductImageSettings } from '$lib/utils/productImage'
import { getErrorMessage } from '$lib/utils/errors'
import { POS_KEYS } from '$lib/modules/POS/constants/queryKeys'
import { PRODUCT_KEYS } from '../../../constants/queryKeys'

/**
 * Configuración de imágenes del servidor.
 *
 * `retry: false` es deliberado: un backend sin el módulo de imágenes (una
 * versión atrás) no expone esta ruta y responde 404. Reintentar castigaría
 * cada apertura de formulario con peticiones fallidas; un solo 404 basta para
 * saber que aquí no hay imágenes y ocultar el campo.
 *
 * `staleTime: Infinity` porque son límites de configuración: cambian cuando se
 * reinicia el servidor, no durante una sesión.
 */
export const useProductImageSettings = () =>
    createQuery<ProductImageSettings>({
        queryKey: ['inventory', 'image-settings'],
        queryFn: getProductImageSettings,
        staleTime: Infinity,
        gcTime: Infinity,
        retry: false,
        refetchOnWindowFocus: false
    })

interface UseProductImageOptions {
    /**
     * RUTA de la imagen guardada (`product.image`). Es la que dice SI el item
     * tiene foto. Se distingue de `currentUrl` a propósito: si la firma falla,
     * la URL viene null pero la imagen EXISTE, y sin esta distinción el
     * usuario no podría ni verla ni borrarla.
     */
    imagePath?: string | null
    /** URL firmada para previsualizar (modo edición). Puede faltar. */
    currentUrl?: string | null
}

/**
 * Estado y sincronización de la imagen de un item del inventario.
 *
 * La imagen NO viaja en el payload del producto: es un archivo que se sube
 * aparte, contra el id del item. Eso obliga a un orden concreto en
 * creación —primero existe el producto, después su foto— y este hook lo
 * encapsula para que los formularios (base y presentación) hagan exactamente
 * lo mismo:
 *
 *   1. El usuario elige/quita la imagen → solo se guarda la intención aquí.
 *   2. El formulario guarda el producto y obtiene su id.
 *   3. Llama a `syncImage(id)`, que sube o quita según corresponda.
 *
 * Si el paso 3 falla, el producto YA quedó guardado: se devuelve el mensaje
 * para avisar, pero no se revierte nada. Perder el producto por un problema al
 * subir la foto sería un pésimo negocio para el usuario.
 *
 * Sin `productId` en las dependencias (a diferencia de la versión de
 * placepos/React): cada formulario de este proyecto se remonta por completo
 * vía `{#key producto?.id ?? 'new'}` al cambiar de producto, así que este
 * `$state` YA nace limpio por cada instancia — no hace falta un efecto que
 * lo reinicie.
 */
export function useProductImage({ imagePath, currentUrl }: UseProductImageOptions = {}) {
    const queryClient = useQueryClient()
    const settingsQuery = fromStore(useProductImageSettings())

    let pendingFile = $state<File | null>(null)
    /** El usuario quitó la imagen ya guardada (solo aplica en edición). */
    let isRemoved = $state(false)
    let isUploading = $state(false)

    const selectImage = (file: File) => {
        pendingFile = file
        isRemoved = false
    }

    const removeImage = () => {
        pendingFile = null
        // Solo hay algo que borrar en el servidor si YA había una guardada. Se
        // mira la RUTA y no la URL: con la firma caída la URL viene null pero
        // el archivo existe, y decidir por la URL dejaría esa imagen imborrable.
        isRemoved = Boolean(imagePath)
    }

    const reset = () => {
        pendingFile = null
        isRemoved = false
        isUploading = false
    }

    /**
     * Aplica la intención del usuario sobre el item ya guardado. Devuelve el
     * mensaje de error si la imagen no se pudo sincronizar, o `null` si todo
     * salió bien (incluido el caso "no había nada que hacer").
     */
    const syncImage = async (savedProductId: number): Promise<string | null> => {
        if (settingsQuery.current.data?.enabled !== true) return null
        if (!pendingFile && !isRemoved) return null

        isUploading = true
        try {
            if (pendingFile) {
                await uploadProductImage(savedProductId, pendingFile)
            } else {
                await removeProductImage(savedProductId)
            }
            // El inventario y el POS/catálogo (misma key, ['pos','items']) deben
            // mostrar la foto nueva sin recargar.
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.list }),
                queryClient.invalidateQueries({ queryKey: POS_KEYS.items })
            ])
            return null
        } catch (error) {
            return getErrorMessage(error) ?? 'No se pudo guardar la imagen'
        } finally {
            isUploading = false
        }
    }

    return {
        get settings() {
            return settingsQuery.current.data ?? DEFAULT_IMAGE_SETTINGS
        },
        get isEnabled() {
            return settingsQuery.current.data?.enabled === true
        },
        get pendingFile() {
            return pendingFile
        },
        /** URL a mostrar: null si el usuario la quitó y aún no se guarda. */
        get previewUrl() {
            return isRemoved ? null : (currentUrl ?? null)
        },
        /**
         * ¿El item tiene imagen guardada? Se deriva de la RUTA, así que sigue
         * siendo `true` aunque la firma haya fallado — y el botón de quitar
         * aparece igual.
         */
        get hasStoredImage() {
            return !isRemoved && Boolean(imagePath)
        },
        get isUploading() {
            return isUploading
        },
        selectImage,
        removeImage,
        reset,
        syncImage
    }
}
