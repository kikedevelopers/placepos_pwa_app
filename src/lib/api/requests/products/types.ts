// Paridad con placepos (api/requests/inventory/types.ts). pos_api expone estos
// productos en @Controller('inventory'). stock es la unidad mínima; stock_display
// es lo que se muestra (stock / packaging.value).

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
}

export type ProductListParams = {
    search?: string
    include_archived?: boolean
}
