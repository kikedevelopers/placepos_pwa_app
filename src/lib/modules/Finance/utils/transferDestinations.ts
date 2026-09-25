import type {
    AccountTransferDestination,
    TransferDestinationScope
} from '$lib/api/requests/accounts'

/**
 * Lógica PURA del selector de destinos de "Mover saldo" (PWA). Se aísla del
 * hook `.svelte.ts` para poder testearla en vitest sin runes.
 *
 * Multi-sucursal: cada destino tiene `scope` ('self' misma empresa | 'main'
 * negocio principal). El value de la opción codifica `scope|type|id`; el scope
 * es necesario porque un banco/billetera del principal puede compartir id con
 * uno propio.
 */

/** Construye el value de una opción del <select>. */
export const buildDestinationValue = (
    scope: TransferDestinationScope,
    type: AccountTransferDestination['type'],
    id: number
): string => `${scope}|${type}|${id}`

/** Parsea el value de una opción. Devuelve null si el formato es inválido. */
export const parseDestinationValue = (
    value: string
): { scope: TransferDestinationScope; type: string; id: number } | null => {
    if (!value) return null
    const parts = value.split('|')
    if (parts.length !== 3) return null
    const [scope, type, id] = parts
    if (!scope || !type || id === '' || Number.isNaN(Number(id))) return null
    return { scope: scope as TransferDestinationScope, type, id: Number(id) }
}

/** Encuentra el destino correspondiente a un value, respetando el scope. */
export const findDestination = (
    destinations: AccountTransferDestination[],
    value: string
): AccountTransferDestination | null => {
    const parsed = parseDestinationValue(value)
    if (!parsed) return null
    return (
        destinations.find(
            (d) =>
                (d.scope ?? 'self') === parsed.scope && d.type === parsed.type && d.id === parsed.id
        ) ?? null
    )
}

export interface GroupedTransferDestinations {
    users: AccountTransferDestination[]
    wallets: AccountTransferDestination[]
    banks: AccountTransferDestination[]
    main: AccountTransferDestination[]
    mainCompanyName: string
}

/**
 * Agrupa los destinos: los propios ('self') por tipo y los del negocio
 * principal ('main') en una sección aparte. Un destino sin `scope` se trata
 * como 'self' (respuesta legacy del backend).
 */
export const groupDestinations = (
    destinations: AccountTransferDestination[]
): GroupedTransferDestinations => {
    const self = destinations.filter((d) => (d.scope ?? 'self') === 'self')
    const main = destinations.filter((d) => d.scope === 'main')
    return {
        users: self.filter((d) => d.type === 'user'),
        wallets: self.filter((d) => d.type === 'wallet'),
        banks: self.filter((d) => d.type === 'bank'),
        main,
        mainCompanyName: main[0]?.company_name ?? 'Negocio Principal'
    }
}
