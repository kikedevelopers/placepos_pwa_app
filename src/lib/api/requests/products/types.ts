// Paridad con placepos (api/requests/inventory/types.ts). pos_api expone estos
// productos en @Controller('inventory'). stock es la unidad mínima; stock_display
// es lo que se muestra (stock / packaging.value).

import type { ProductImageSettings } from '$lib/utils/productImage'

export type { ProductImageSettings }

export type ProductType = 'SIMPLE' | 'COMBO'

export type ProductPrice = {
    id?: number
    name?: string
    sale_price: number
    profit: number
    margin: number
    iva_percentage?: number
}

export type Product = {
    id: number
    name: string
    bar_code: string | null
    sku_code: string | null
    description: string | null
    cost: number
    stock: number
    stock_display: number
    product_type: ProductType
    parent_id: number | null
    packaging_id: number | null
    category_id: number | null
    show_in_pos: boolean
    is_purchasable: boolean
    is_archived: boolean
    archived: boolean
    created_at: string
    packaging: { id: number; name: string; value: number } | null
    category: { id: number; name: string } | null
    prices: ProductPrice[]
    // Imagen del item. OPCIONALES a propósito (paridad version-skew con
    // placepos): un pos_api una versión atrás no los envía, y el front debe
    // degradar al placeholder en vez de romperse.
    //   - image: ruta del objeto en el bucket. Sirve para saber SI hay imagen.
    //   - image_url: URL firmada temporal; es la única que se puede pintar.
    image?: string | null
    image_url?: string | null
}

export type ProductPricePayload = {
    id?: number
    name?: string
    sale_price: number
    profit: number
    margin: number
}

export type ProductPayload = {
    name: string
    sku_code?: string
    bar_code?: string
    description?: string
    product_type: ProductType
    category_id: number | null
    packaging_id: number | null
    show_in_pos: boolean
    is_purchasable: boolean
    stock: number
    cost: number
    prices: ProductPricePayload[]
    // Presentaciones (producto hijo): `parent_id` la marca como presentación;
    // `packaging_value` (peso variable) hace find-or-create de un empaque auto en
    // el backend, mutuamente excluyente con `packaging_id`.
    parent_id?: number | null
    packaging_value?: number
}

export type ProductListParams = {
    search?: string
    include_archived?: boolean
}

/** Resultado de `POST /inventory/:id/image`. */
export type ProductImageResult = {
    product_id: number
    /** Ruta del objeto en el bucket (no se pinta: no es accesible por sí sola). */
    image: string
    /** URL firmada temporal: esta es la que se muestra. */
    image_url: string
}

/** Resultado de `POST /inventory/:id/image/remove`. */
export type RemoveProductImageResult = {
    product_id: number
    /** `false` = el item ya no tenía imagen (la operación es idempotente). */
    removed: boolean
}
