// Paridad con placepos (api/requests/customer/types.ts). pos_api refleja el
// mismo contrato; el balance es SIGNED (>0 le debemos al cliente, <0 nos debe).

export type PersonType = 'INDIVIDUAL' | 'COMPANY'

export type Customer = {
    id: number
    person_type: PersonType
    name: string
    email: string | null
    phone: string | null
    doc_number: string | null
    address: string | null
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
}

export type CustomerAnalytics = {
    customers_count: number
    new_customers: number
}

export type CustomerListParams = {
    search?: string
    include_archived?: boolean
    limit?: number
    offset?: number
}
