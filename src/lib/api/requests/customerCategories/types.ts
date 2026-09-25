// Categorías ESPECIALES de cliente. Espejo del contrato /customer-categories de
// pos_api. created_by/created_by_id son resilientes a version-skew.

export type CustomerCategory = {
    id: number
    name: string
    is_archived: boolean
    created_by?: string | null
    created_by_id?: number | null
    created_at: string
}

export type CreateCustomerCategoryPayload = {
    name: string
}
