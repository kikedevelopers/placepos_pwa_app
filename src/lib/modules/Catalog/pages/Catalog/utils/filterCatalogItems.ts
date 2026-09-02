import type { PosProduct } from '$lib/api/requests/pos'

/**
 * Filtra por nombre/SKU/código de barras (mismo criterio que el buscador de
 * Inventario) y ordena alfabéticamente por nombre. `/pos-data/items` ya llega
 * ordenado por fecha de creación (lo que pide el POS); un catálogo para
 * hojear se navega mejor de la A a la Z.
 */
export const filterCatalogItems = (items: PosProduct[], search: string): PosProduct[] => {
    const q = search.trim().toLowerCase()
    const matches = q
        ? items.filter(
              (item) =>
                  item.name.toLowerCase().includes(q) ||
                  item.sku_code.toLowerCase().includes(q) ||
                  item.bar_code.toLowerCase().includes(q)
          )
        : items

    return [...matches].sort((a, b) => a.name.localeCompare(b.name, 'es'))
}
