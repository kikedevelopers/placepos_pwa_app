/** Tipo de relación con otro producto (ver pos_api `catalog-knowledge`). */
export type RelatedKind = 'complement' | 'upgrade' | 'alternative'

export interface ProductAttribute {
    name: string
    value: string
}

export interface RelatedProduct {
    product_id: number
    kind: RelatedKind
    /** Nombre del producto (solo lectura, lo pone el servidor). */
    name: string
}

/** Ficha "Para el asistente" de un producto base. */
export interface AssistantProfile {
    product_id: number
    description: string
    uses: string[]
    attributes: ProductAttribute[]
    aliases: string[]
    related: RelatedProduct[]
    updated_at: string | null
}

export interface UpdateAssistantProfilePayload {
    description: string
    uses: string[]
    attributes: ProductAttribute[]
    aliases: string[]
    related: Array<{ product_id: number; kind: RelatedKind }>
}

/** Propuesta de "Completar con IA" (no se guarda sola). */
export interface AssistantProfileSuggestion {
    description: string
    uses: string[]
    attributes: ProductAttribute[]
    aliases: string[]
}
