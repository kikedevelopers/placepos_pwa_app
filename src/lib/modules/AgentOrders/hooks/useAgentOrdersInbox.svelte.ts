import { fromStore, toStore } from 'svelte/store'
import {
    createInfiniteQuery,
    createMutation,
    createQuery,
    useQueryClient
} from '@tanstack/svelte-query'
import {
    getAgentOrder,
    getAgentOrders,
    updateAgentOrderStatus
} from '$lib/api/requests/agentOrders'
import type {
    AgentOrder,
    AgentOrderStatus,
    AgentOrderStatusFilter,
    AgentOrdersList
} from '$lib/api/requests/agentOrders/types'
import { useDebouncedValue } from '$lib/hooks/useDebouncedValue.svelte'
import { getErrorMessage } from '$lib/utils/errors'
import { AGENT_ORDERS_KEYS, AGENT_ORDERS_PAGE_SIZE } from '../constants'
import { newlyArrivedIds } from '../utils/agentOrders'

/** Cuánto dura el resaltado de un pedido que acaba de llegar. */
export const ARRIVAL_HIGHLIGHT_MS = 2400

/** ¿Hay otra página? (cuántos se han cargado vs. el total del servidor). */
export const nextPageOf = (pages: readonly AgentOrdersList[]): number | undefined => {
    const loaded = pages.reduce((sum, page) => sum + page.items.length, 0)
    const last = pages[pages.length - 1]
    if (!last || loaded >= last.total_count || last.items.length === 0) return undefined
    return last.page + 1
}

/**
 * Estado de Reportes → Agente (espejo de `useAgentOrdersReport` de placepos,
 * con scroll infinito en vez de paginador): filtro de estado, búsqueda, la
 * bandeja (refrescada en tiempo real por `agent-orders:changed`), el pedido
 * abierto, las llegadas recientes y el cambio de estado.
 *
 * `linkedOrderId` (de `?order=` al tocar una notificación): abre ESE pedido y
 * mira "Todos", porque pudo haber cambiado de estado.
 */
export const useAgentOrdersInbox = (linkedOrderId: () => number | null) => {
    const queryClient = useQueryClient()

    let status = $state<AgentOrderStatusFilter>(linkedOrderId() ? 'all' : 'pending')
    let search = $state('')
    let selectedId = $state<number | null>(linkedOrderId())
    let arrivedIds = $state<number[]>([])
    let actionError = $state<string | null>(null)
    const debouncedSearch = useDebouncedValue(() => search.trim(), 300)

    // Otra notificación con la bandeja ya abierta: cambia a ese pedido.
    $effect(() => {
        const linked = linkedOrderId()
        if (!linked) return
        selectedId = linked
        if (status !== 'all') status = 'all'
    })

    const params = $derived({ status, search: debouncedSearch.value })

    const list = fromStore(
        createInfiniteQuery(
            toStore(() => ({
                queryKey: AGENT_ORDERS_KEYS.list(params),
                queryFn: ({ pageParam }: { pageParam: number }) =>
                    getAgentOrders({
                        status: params.status,
                        search: params.search,
                        page: pageParam,
                        limit: AGENT_ORDERS_PAGE_SIZE
                    }),
                initialPageParam: 1,
                getNextPageParam: (_last: AgentOrdersList, pages: AgentOrdersList[]) =>
                    nextPageOf(pages),
                refetchOnWindowFocus: true
            }))
        )
    )

    const orders = $derived<AgentOrder[]>(list.current.data?.pages.flatMap((page) => page.items) ?? [])

    // El pedido abierto: el de la lista o, si no está cargado (otra página, otro
    // filtro), pedido aparte.
    const inList = $derived(orders.find((order) => order.id === selectedId) ?? null)
    const single = fromStore(
        createQuery(
            toStore(() => ({
                queryKey: [...AGENT_ORDERS_KEYS.all, 'one', selectedId],
                queryFn: () => getAgentOrder(selectedId as number),
                enabled: selectedId !== null && !inList && !list.current.isLoading,
                retry: false
            }))
        )
    )
    const selected = $derived<AgentOrder | null>(inList ?? single.current.data ?? null)

    // Llegadas en vivo: ids nuevos en la MISMA vista (no al cambiar de filtro).
    let lastView: { key: string; ids: number[] } | null = null
    const timers: ReturnType<typeof setTimeout>[] = []
    $effect(() => {
        if (!list.current.data || list.current.isFetching) return
        const key = JSON.stringify(params)
        const ids = orders.map((order) => order.id)
        const previous = lastView?.key === key ? lastView.ids : null
        lastView = { key, ids }
        const arrived = newlyArrivedIds(previous, ids)
        if (arrived.length === 0) return
        arrivedIds = [...arrivedIds, ...arrived]
        // Cada llegada tiene su temporizador: otra llegada no lo cancela.
        timers.push(
            setTimeout(() => {
                arrivedIds = arrivedIds.filter((id) => !arrived.includes(id))
            }, ARRIVAL_HIGHLIGHT_MS)
        )
    })
    $effect(() => () => timers.forEach(clearTimeout))

    const mutation = fromStore(
        createMutation({
            mutationFn: (input: { id: number; status: AgentOrderStatus; note?: string }) =>
                updateAgentOrderStatus(input.id, { status: input.status, note: input.note }),
            onMutate: () => {
                actionError = null
            },
            onError: (error: unknown) => {
                actionError = getErrorMessage(error) ?? 'No se pudo actualizar el pedido. Inténtalo de nuevo.'
            },
            onSettled: () => queryClient.invalidateQueries({ queryKey: AGENT_ORDERS_KEYS.all })
        })
    )

    const firstPage = $derived(list.current.data?.pages[0] ?? null)

    return {
        get status() {
            return status
        },
        setStatus(next: AgentOrderStatusFilter) {
            status = next
        },
        get search() {
            return search
        },
        set search(value: string) {
            search = value
        },
        get orders() {
            return orders
        },
        get summary() {
            return firstPage?.summary ?? null
        },
        get totalCount() {
            return firstPage?.total_count ?? 0
        },
        get isLoading() {
            return list.current.isLoading
        },
        get isError() {
            return list.current.isError
        },
        get isRefetching() {
            return list.current.isFetching && !list.current.isFetchingNextPage && !list.current.isLoading
        },
        get hasMore() {
            return list.current.hasNextPage === true
        },
        get isLoadingMore() {
            return list.current.isFetchingNextPage
        },
        loadMore() {
            if (list.current.hasNextPage && !list.current.isFetchingNextPage) {
                void list.current.fetchNextPage()
            }
        },
        refetch() {
            void list.current.refetch()
        },
        get selected() {
            return selected
        },
        get selectedId() {
            return selectedId
        },
        select(id: number | null) {
            selectedId = id
            actionError = null
        },
        get arrivedIds() {
            return arrivedIds
        },
        changeStatus(id: number, next: AgentOrderStatus, note?: string): Promise<boolean> {
            return mutation.current.mutateAsync({ id, status: next, note }).then(
                () => true,
                () => false
            )
        },
        get updatingId(): number | null {
            return mutation.current.isPending ? (mutation.current.variables?.id ?? null) : null
        },
        get actionError() {
            return actionError
        },
        clearActionError() {
            actionError = null
        }
    }
}

export type AgentOrdersInbox = ReturnType<typeof useAgentOrdersInbox>
