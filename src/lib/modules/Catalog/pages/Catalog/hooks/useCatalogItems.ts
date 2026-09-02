import { createQuery } from '@tanstack/svelte-query'
import { getPosItems } from '$lib/api/requests/pos'
import { POS_KEYS } from '$lib/modules/POS/constants/queryKeys'

// Mismo endpoint que el POS (`/pos-data/items`): ya llega filtrado a lo
// vendible (show_in_pos, no archivado) con precio e imagen resueltos — es
// exactamente lo que un catálogo debe mostrar. Reusa POS_KEYS.items (no una
// key propia): son los MISMOS datos, y el evento realtime `ticket:changed`
// (src/lib/realtime/handlers.ts) invalida esa key en cada venta para
// refrescar el stock. Con una key propia, "Agotado" quedaría desactualizado
// hasta 5 min tras una venta real en otro punto del negocio — además de
// duplicar el fetch (y el gasto de cuota al re-firmar las URLs de imagen).
const STALE_TIME = 5 * 60_000

export const useCatalogItems = () =>
    createQuery({ queryKey: POS_KEYS.items, queryFn: getPosItems, staleTime: STALE_TIME })
