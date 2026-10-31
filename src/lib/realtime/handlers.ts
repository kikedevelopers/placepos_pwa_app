import type { QueryKey } from '@tanstack/svelte-query'

/**
 * Mapa declarativo evento→queryKeys (espejo de `useRealtimeInvalidation` en
 * placepos). Eventos de pos_api que escucha la PWA:
 *   - `ticket:changed`       → tras crear una venta; llega al vendedor y a los
 *                              managers/owner de la company.
 *   - `dashboard:changed`    → tras CUALQUIER mutación; llega solo a managers/owner.
 *   - `agent-orders:changed` → pedido del agente nuevo/cambiado (y al dueño, los
 *                              de sus otras sucursales).
 *   - `alert:created`        → alerta nueva de la campana.
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
            ['customers'],
            // Cobrar o anular el ticket de un pedido del agente cambia su
            // consecutivo (PED-x → VTA-x) en la bandeja.
            ['agent-orders']
        ],
        debounceMs: 800
    },
    {
        // Pedido del agente nuevo o cambiado por el cliente: la bandeja de
        // Reportes → Agente y la campana, al instante. Un empleado Administrador
        // no recibe `alert:created` (va a dueño/gerente) pero sí este evento.
        event: 'agent-orders:changed',
        keys: [['agent-orders'], ['app-alerts']],
        debounceMs: 0
    },
    {
        // Cualquier alerta nueva (pedido del agente, gasto fijo vencido…): la
        // campana se actualiza sola.
        event: 'alert:created',
        keys: [['app-alerts']],
        debounceMs: 0
    }
]
