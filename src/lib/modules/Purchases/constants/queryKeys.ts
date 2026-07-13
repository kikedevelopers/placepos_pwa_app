export const PURCHASE_KEYS = {
    list: (showAll: boolean) => ['purchases', 'list', showAll] as const,
    detail: (id: number) => ['purchases', 'detail', id] as const
}
