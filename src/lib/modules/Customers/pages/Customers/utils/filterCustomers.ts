import type { Customer } from '$lib/api/requests/customers'

/**
 * Filtra la lista de clientes por término de búsqueda (nombre/correo/documento)
 * y por categoría ESPECIAL. Función pura para poder testearla sin montar la
 * página. `categoryId === null` ⇒ no filtra por categoría.
 */
export function filterCustomers(
    list: Customer[],
    search: string,
    categoryId: number | null
): Customer[] {
    const q = search.trim().toLowerCase()
    return list.filter((c) => {
        const matchesSearch =
            !q ||
            c.name.toLowerCase().includes(q) ||
            (c.email ?? '').toLowerCase().includes(q) ||
            (c.doc_number ?? '').toLowerCase().includes(q)
        const matchesCategory = categoryId === null || c.category_id === categoryId
        return matchesSearch && matchesCategory
    })
}
