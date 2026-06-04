import type { AccountType } from '$lib/api/requests/financial-movements/types'

/** Query keys de billeteras. */
export const WALLET_KEYS = {
    all: ['wallets'] as const,
    list: ['wallets', 'list'] as const
}

/** Query keys de cuentas bancarias. */
export const BANK_KEYS = {
    all: ['banks'] as const,
    list: ['banks', 'list'] as const
}

/** Query key de los movimientos de una cuenta. */
export const MOVEMENT_KEYS = {
    all: ['movements'] as const,
    byAccount: (type: AccountType, id: number | null) => ['movements', type, id] as const
}
