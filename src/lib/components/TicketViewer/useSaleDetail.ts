import { toStore } from 'svelte/store'
import { createQuery } from '@tanstack/svelte-query'
import { getSale } from '$lib/api/requests/sales'

/**
 * Detalle completo de una venta (líneas + pagos + crédito) para el
 * TicketViewer. Comparte el mismo queryKey que el hook del POS
 * (`['sales', 'detail', id]`) para reaprovechar la caché de svelte-query.
 * `id` es un getter para reaccionar al ticket abierto.
 */
export const useSaleDetail = (id: () => number | null) =>
    createQuery(
        toStore(() => ({
            queryKey: ['sales', 'detail', id()],
            queryFn: () => getSale(id() as number),
            enabled: id() != null
        }))
    )
