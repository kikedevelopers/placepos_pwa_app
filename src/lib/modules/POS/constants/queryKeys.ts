// Query keys del POS (paridad pos_app, verbatim de los hooks de zustand/react-query).
// Las invalidaciones tras cobrar usan ['pos','items'], ['sales','today'] y
// ['pos','cash-summary'] — mismas claves que aquí.
export const POS_KEYS = {
    items: ['pos', 'items'] as const,
    customers: ['pos', 'customers'] as const,
    banks: ['pos', 'banks'] as const,
    cashSummary: ['pos', 'cash-summary'] as const,
    transferDestinations: ['pos', 'transfer-destinations'] as const
}

export const SALES_KEYS = {
    today: ['sales', 'today'] as const,
    detail: (id: number | null) => ['sales', 'detail', id] as const
}
