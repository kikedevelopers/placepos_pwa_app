/** Origen de un traslado: solo billetera o banco (paridad pos_api). */
export type TransferSourceType = 'wallet' | 'bank'

/** Destino de un traslado: billetera, banco o la caja de un usuario. */
export type TransferDestinationType = 'wallet' | 'bank' | 'user'

/** Alcance del destino: misma empresa ('self') o negocio principal ('main'). */
export type TransferDestinationScope = 'self' | 'main'

/** Cuenta destino candidata para un traslado. Réplica del `TransferDestinationItem`. */
export type AccountTransferDestination = {
    id: number
    name: string
    balance: number
    type: TransferDestinationType
    // Multi-sucursal. Opcional para tolerar respuestas legacy (siempre 'self').
    scope?: TransferDestinationScope
    company_name?: string
}

export type TransferDestinationsResult = {
    destinations: AccountTransferDestination[]
}

/** Payload de `POST /accounts/transfer`. camelCase fiel al contrato cloud. */
export type AccountTransferPayload = {
    sourceType: TransferSourceType
    sourceId: number
    destinationType: TransferDestinationType
    destinationId: number
    amount: number
    // 'main' dispara el traslado sucursal → negocio principal. Se omite para
    // traslados dentro de la misma empresa (el backend asume 'self').
    destinationScope?: TransferDestinationScope
}

export type AccountTransferResult = {
    message: string
    source: { type: TransferSourceType; id: number; balance: number }
    destination: { type: TransferDestinationType; id: number; balance: number }
}
