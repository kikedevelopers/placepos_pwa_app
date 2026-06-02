import { toStore } from 'svelte/store'
import { createQuery } from '@tanstack/svelte-query'
import { getSale, getSales } from '$lib/api/requests/sales'
import { SALES_KEYS } from '$lib/modules/POS/constants/queryKeys'

/**
 * Tickets del día (ORDER + SALE). Refetch cada 10s mientras no haya error,
 * paridad con el `refetchInterval` de pos_app.
 */
export const useDailySales = () =>
    createQuery({
        queryKey: SALES_KEYS.today,
        queryFn: () => getSales(),
        refetchInterval: (query) => (query.state.status === 'error' ? false : 10_000)
    })

/**
 * Detalle de una venta. `id` es un getter para que el queryKey sea reactivo
 * (svelte-query no refetchea con un queryKey estático). Comparte el queryKey
 * `['sales','detail',id]` con el `useSaleDetail` del TicketViewer.
 *
 * Para abrir el TicketViewer desde el POS se reutiliza el `useSaleDetail` ya
 * portado en `$lib/components/TicketViewer`; este hook queda disponible para
 * usos directos del detalle dentro del módulo.
 */
export const useSale = (id: () => number | null) =>
    createQuery(
        toStore(() => ({
            queryKey: SALES_KEYS.detail(id()),
            queryFn: () => getSale(id() as number),
            enabled: id() != null
        }))
    )
