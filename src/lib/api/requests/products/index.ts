import api from '$lib/api/config'
import type { ApiPayload } from '$lib/api/requests/dashboard/types'
import type {
    Product,
    ProductImageResult,
    ProductImageSettings,
    ProductListParams,
    ProductPayload,
    RemoveProductImageResult
} from './types'

type MutationResult = { id: number; name: string }

export const getProducts = async (params: ProductListParams = {}): Promise<Product[]> => {
    const response = await api.get<ApiPayload<Product[]>>('/inventory', { params })
    return response.data.payload
}

export const createProduct = async (payload: ProductPayload): Promise<MutationResult> => {
    const response = await api.post<ApiPayload<MutationResult>>('/inventory', payload)
    return response.data.payload
}

export const updateProduct = async (
    id: number,
    payload: ProductPayload
): Promise<MutationResult> => {
    const response = await api.put<ApiPayload<MutationResult>>(`/inventory/${id}`, payload)
    return response.data.payload
}

/**
 * Sube o REEMPLAZA la imagen del item (base, presentación o combo — los tres
 * son filas de `products`). Vale igual para los tres formularios.
 *
 * `Content-Type: undefined` es obligatorio: la instancia de axios fija
 * `application/json` por defecto, y sin este override serializa el
 * `FormData` a JSON en vez de mandarlo como multipart — el archivo se pierde
 * en silencio. Ver memoria `feedback_axios_formdata_content_type`.
 */
export const uploadProductImage = async (id: number, file: File): Promise<ProductImageResult> => {
    const form = new FormData()
    form.append('image', file)
    const response = await api.post<ApiPayload<ProductImageResult>>(
        `/inventory/${id}/image`,
        form,
        { headers: { 'Content-Type': undefined } }
    )
    return response.data.payload
}

export const removeProductImage = async (id: number): Promise<RemoveProductImageResult> => {
    const response = await api.post<ApiPayload<RemoveProductImageResult>>(
        `/inventory/${id}/image/remove`
    )
    return response.data.payload
}

/**
 * Límites reales del servidor para la imagen (peso, formatos, dimensiones
 * recomendadas) y si tiene almacenamiento configurado. El formulario los usa
 * para decidir si muestra el campo y para validar antes de subir.
 */
export const getProductImageSettings = async (): Promise<ProductImageSettings> => {
    const response = await api.get<ApiPayload<ProductImageSettings>>('/inventory/image-settings')
    return response.data.payload
}

export * from './types'
