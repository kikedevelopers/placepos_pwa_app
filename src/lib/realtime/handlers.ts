import type { QueryKey } from '@tanstack/svelte-query'

/**
 * Mapa declarativo evento→queryKeys (espejo de `useRealtimeInvalidation` en
 * placepos). El servidor (pos_api) emite SOLO dos eventos:
 *   - `ticket:changed`    → tras crear una venta; llega al vendedor y a los
 *                           managers/owner de la company.
 *   - `dashboard:changed` → tras CUALQUIER mutación; llega solo a managers/owner.
 * Los permisos los resuelve el servidor vía rooms; aquí solo invalidamos y el
 * refetch HTTP re-aplica el filtrado por rol.
 */
export interface RealtimeHandler {
    event: string
    keys: QueryKey[]
    /** Coalescencia de ráfagas; 0 = invalidar al instante. */
    debounceMs?: number
}

export const REALTIME_HANDLERS: RealtimeHandler[] = [
    {
        // Una venta nueva cambia la lista de tickets, el saldo de caja y el stock.
        event: 'ticket:changed',
        keys: [
            ['sales', 'today'],
            ['pos', 'cash-summary'],
            ['pos', 'items']
        ],
        debounceMs: 0
    },
    {
        // Cualquier mutación (venta, gasto, caja, crédito, cliente…) refresca los
        // informes del dashboard, la meta diaria del footer y los reportes. El
        // prefijo `['reports']` invalida todos los reportes (ventas, cajeros,
        // créditos, cierre) por el match parcial de svelte-query.
        event: 'dashboard:changed',
        keys: [
            ['dashboard', 'today'],
            ['home', 'break-even'],
            ['reports'],
            ['expenses', 'list'],
            ['fixed-expenses', 'list'],
            ['pos', 'cash-summary'],
            ['customers']
        ],
        debounceMs: 800
    }
]
