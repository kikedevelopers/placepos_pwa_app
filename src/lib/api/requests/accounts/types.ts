/** Origen de un traslado: solo billetera o banco (paridad pos_api). */
export type TransferSourceType = 'wallet' | 'bank'

/** Destino de un traslado: billetera, banco o la caja de un usuario. */
export type TransferDestinationType = 'wallet' | 'bank' | 'user'

/** Cuenta destino candidata para un traslado. Réplica del `TransferDestinationItem`. */
export type AccountTransferDestination = {
    id: number
    name: string
    balance: number
    type: TransferDestinationType
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
}

export type AccountTransferResult = {
    message: string
    source: { type: TransferSourceType; id: number; balance: number }
    destination: { type: TransferDestinationType; id: number; balance: number }
}
