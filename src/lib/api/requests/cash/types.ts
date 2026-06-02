export type CashSummary = {
    balance: number
    base_amount: number
    available_to_move: number
}

export type CashDestination = {
    id: number
    name: string
    balance: number
    type: 'user' | 'wallet' | 'bank'
}

export type TransferDestinations = {
    users: CashDestination[]
    wallets: CashDestination[]
    banks: CashDestination[]
}

export type CloseCashPayload = {
    destinationType?: 'wallet' | 'bank'
    destinationId?: number
    amount_to_transfer: number
    counted_amount?: number
    reconcile?: boolean
}

export type CloseCashResult = {
    message: string
    moved_amount: number
    difference: number
    new_balance: number
}
