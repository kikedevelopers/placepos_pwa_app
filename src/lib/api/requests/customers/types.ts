// Paridad con placepos (api/requests/customer/types.ts). pos_api refleja el
// mismo contrato; el balance es SIGNED (>0 le debemos al cliente, <0 nos debe).

export type PersonType = 'INDIVIDUAL' | 'COMPANY'

/** Categoría ESPECIAL del cliente anidada en la respuesta (id + nombre). */
export type CustomerCategoryRef = {
    id: number
    name: string
}

export type Customer = {
    id: number
    person_type: PersonType
    name: string
    email: string | null
    phone: string | null
    doc_number: string | null
    address: string | null
    // Categoría especial del cliente. Resiliente a version-skew: un pos_api
    // anterior no manda estos campos.
    category_id?: number | null
    category?: CustomerCategoryRef | null
    balance: number
    is_archived: boolean
    created_by: string | null
    created_at: string
}

export type CustomerPayload = {
    person_type: PersonType
    name: string
    email?: string
    phone?: string
    doc_number?: string
    address?: string
    // Categoría especial. `null` limpia la asociación.
    category_id?: number | null
}

export type CustomerAnalytics = {
    customers_count: number
    new_customers: number
}

export type CustomerListParams = {
    search?: string
    include_archived?: boolean
    category_id?: number
    limit?: number
    offset?: number
}
