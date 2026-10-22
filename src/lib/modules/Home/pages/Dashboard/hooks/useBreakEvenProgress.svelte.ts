import { fromStore } from 'svelte/store'
import { createQuery } from '@tanstack/svelte-query'
import { getBreakEvenProgress } from '$lib/api/requests/dashboard'
import { QUERY_KEYS } from '$lib/modules/Home/constants/queryKeys'
import { computeDerived } from '$lib/modules/Home/pages/Dashboard/utils/goalDerived'

export {
    formatGoalPercent,
    type BreakEvenDerived,
    type GoalTone
} from '$lib/modules/Home/pages/Dashboard/utils/goalDerived'

/**
 * Debe llamarse durante la inicialización de un componente. `fromStore` adapta
 * el store de svelte-query a runes para que los getters sean reactivos.
 */
export const useBreakEvenProgress = (date?: string) => {
    const query = createQuery({
        queryKey: [...QUERY_KEYS.breakEven, date ?? 'today'],
        queryFn: () => getBreakEvenProgress(date),
        // Se detiene el polling si la última carga falló (no reintentar 4xx en bucle).
        refetchInterval: (q) => (q.state.status === 'error' ? false : 60_000)
    })
    const q = fromStore(query)
    // Memo: se recalcula solo cuando cambian los datos, no en cada lectura.
    const derived = $derived(computeDerived(q.current.data))

    return {
        get isLoading() {
            return q.current.isLoading
        },
        get isError() {
            return q.current.isError
        },
        get error() {
            return q.current.error
        },
        get data() {
            return q.current.data
        },
        refetch() {
            return q.current.refetch()
        },
        get derived() {
            return derived
        }
    }
}
