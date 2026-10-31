<script lang="ts">
    import { goto } from '$app/navigation'
    import { page } from '$app/state'
    import { Bot, LoaderCircle, SearchX } from '@lucide/svelte'
    import AdaptiveSheet from '$lib/components/AdaptiveSheet.svelte'
    import SearchField from '$lib/components/SearchField.svelte'
    import { EmptyState, Segmented, SkeletonList } from '$lib/components/premium'
    import { ticketViewer } from '$lib/components/TicketViewer'
    import { usePermissions } from '$lib/hooks/usePermissions.svelte'
    import { useResponsive } from '$lib/hooks/useResponsive.svelte'
    import { formatCurrency } from '$lib/utils/numbers'
    import type { AgentOrder, AgentOrderStatusFilter } from '$lib/api/requests/agentOrders/types'
    import AgentOrderRow from '../components/AgentOrderRow.svelte'
    import AgentOrderDetail from '../components/AgentOrderDetail.svelte'
    import { useAgentOrdersInbox } from '../hooks/useAgentOrdersInbox.svelte'
    import { STATUS_OPTIONS } from '../utils/agentOrders'

    /**
     * Reportes → Agente: la bandeja de pedidos que cierra el agente de ventas en
     * los chats, en vivo. En el teléfono, la lista y el pedido en un sheet; en
     * la tablet, lista y detalle lado a lado.
     */
    const permissions = usePermissions()
    const responsive = useResponsive()

    // `?order=<id>` (desde una notificación): abre ese pedido y limpia la URL.
    let linkedOrderId = $state<number | null>(null)
    $effect(() => {
        const raw = Number(page.url.searchParams.get('order'))
        if (!Number.isSafeInteger(raw) || raw <= 0) return
        linkedOrderId = raw
        const url = new URL(page.url)
        url.searchParams.delete('order')
        void goto(url, { replaceState: true, noScroll: true, keepFocus: true })
    })

    const inbox = useAgentOrdersInbox(() => linkedOrderId)

    // En la tablet siempre hay un pedido a la vista (el primero si no hay otro).
    $effect(() => {
        if (!responsive.isTablet || inbox.isLoading) return
        if (inbox.selectedId === null && inbox.orders.length > 0) inbox.select(inbox.orders[0].id)
    })

    const sheetOpen = $derived(!responsive.isTablet && inbox.selected !== null)
    // El sheet conserva el último pedido mientras baja (si no, se iría vacío).
    let shown = $state<AgentOrder | null>(null)
    $effect(() => {
        if (inbox.selected) shown = inbox.selected
    })
    const canUsePos = $derived(permissions.canAccessPOS)

    const statusOptions = STATUS_OPTIONS.map((o) => ({
        value: o.value,
        label: o.value === 'dismissed' ? 'Descartados' : o.label
    }))

    const emptyCopy: Record<AgentOrderStatusFilter, { title: string; message: string }> = {
        pending: {
            title: 'No hay pedidos por tomar',
            message: 'Cuando el agente cierre un pedido en el chat, aparece aquí al instante.'
        },
        taken: { title: 'Aún no hay pedidos tomados', message: 'Los que tomes o lleves al POS quedan aquí.' },
        dismissed: { title: 'Nada descartado', message: 'Los pedidos que descartes o cancele el cliente quedan aquí.' },
        all: { title: 'Todavía no hay pedidos', message: 'Cuando el agente cierre uno en el chat, aparece aquí.' }
    }

    // Scroll continuo: al asomarse el final de la lista, la página siguiente.
    let sentinel = $state<HTMLElement | null>(null)
    $effect(() => {
        if (!sentinel) return
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting)) inbox.loadMore()
            },
            { rootMargin: '320px 0px' }
        )
        observer.observe(sentinel)
        return () => observer.disconnect()
    })

    const takeToPos = (id: number) => void goto(`/pos?agentOrder=${id}`)
    const changeStatus = (id: number) => (status: Parameters<typeof inbox.changeStatus>[1], note?: string) =>
        inbox.changeStatus(id, status, note)
</script>

{#snippet detail(order: AgentOrder | null)}
    {#if order}
        <AgentOrderDetail
            {order}
            isUpdating={inbox.updatingId === order.id}
            error={inbox.actionError}
            {canUsePos}
            onChangeStatus={changeStatus(order.id)}
            onTakeToPos={() => takeToPos(order.id)}
            onOpenTicket={(ticketId) => ticketViewer.open(ticketId)}
        />
    {/if}
{/snippet}

<div class="flex flex-1 gap-5 px-5 pb-6 pt-2 md:items-start">
    <div class="flex min-w-0 flex-1 flex-col gap-4 md:max-w-[420px]">
        <!-- Lo que espera: cuántos y cuánto, siempre vigente (sin rango). -->
        <section class="surface flex items-center gap-4 px-5 py-4" aria-label="Pedidos por tomar">
            <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-primary/10 text-primary">
                <Bot size={22} strokeWidth={2} />
            </span>
            <div class="min-w-0 flex-1">
                <p class="text-[13px] font-medium text-muted-foreground">Por tomar</p>
                {#if inbox.summary}
                    <p class="mt-0.5 flex items-baseline gap-2">
                        <span class="text-[26px] font-semibold leading-none tracking-[-0.03em] tabular-nums text-foreground">
                            {inbox.summary.pending_count}
                        </span>
                        <span class="truncate text-[14px] font-medium tabular-nums text-muted-foreground">
                            {formatCurrency(inbox.summary.pending_total)}
                        </span>
                    </p>
                {:else}
                    <span class="mt-1.5 block h-6 w-28 animate-pulse rounded-md bg-foreground/[0.07]"></span>
                {/if}
            </div>
            <span class="flex shrink-0 items-center gap-1.5 text-[12px] font-medium text-muted-foreground">
                <span class="h-2 w-2 rounded-full bg-success shadow-[0_0_0_3px_hsl(var(--success)/0.15)]"></span>
                En vivo
            </span>
        </section>

        <Segmented ariaLabel="Estado de los pedidos" options={statusOptions} value={inbox.status} onChange={(v) => inbox.setStatus(v)} />
        <SearchField bind:value={inbox.search} placeholder="Buscar por referencia, cliente o teléfono" />

        {#if inbox.isLoading}
            <SkeletonList rows={5} />
        {:else if inbox.isError}
            <EmptyState kind="error" title="No se pudo cargar la bandeja" message="Revisa tu conexión e inténtalo de nuevo.">
                {#snippet action()}
                    <button type="button" onclick={() => inbox.refetch()} class="h-10 rounded-full bg-primary px-5 text-[14px] font-semibold text-primary-foreground transition-transform active:scale-[0.97]">
                        Reintentar
                    </button>
                {/snippet}
            </EmptyState>
        {:else if inbox.orders.length === 0}
            <EmptyState
                icon={inbox.search.trim() ? SearchX : Bot}
                title={inbox.search.trim() ? 'Sin resultados' : emptyCopy[inbox.status].title}
                message={inbox.search.trim() ? 'Prueba con otra referencia, nombre o teléfono.' : emptyCopy[inbox.status].message}
            />
        {:else}
            <div class="surface group-rows overflow-hidden" role="list" aria-label="Pedidos del agente">
                {#each inbox.orders as order (order.id)}
                    <div role="listitem" class="row">
                        <AgentOrderRow
                            {order}
                            selected={responsive.isTablet && inbox.selectedId === order.id}
                            arrived={inbox.arrivedIds.includes(order.id)}
                            showStatus={inbox.status === 'all'}
                            onSelect={(id) => inbox.select(id)}
                        />
                    </div>
                {/each}
            </div>
            <div bind:this={sentinel} class="flex h-10 items-center justify-center text-[12.5px] text-muted-foreground">
                {#if inbox.isLoadingMore}
                    <LoaderCircle size={16} class="animate-spin" />
                {:else if !inbox.hasMore && inbox.totalCount > 8}
                    {inbox.totalCount} pedidos
                {/if}
            </div>
        {/if}
    </div>

    {#if responsive.isTablet}
        <!-- Tablet: el pedido abierto al lado, con su barra de acciones. -->
        <aside class="surface sticky top-4 flex h-[calc(100dvh-var(--app-safe-top)-220px)] min-h-[480px] min-w-0 flex-1 flex-col overflow-hidden pt-4" aria-label="Detalle del pedido">
            {#if inbox.selected}
                {#key inbox.selected.id}
                    <div class="flex min-h-0 flex-1 flex-col motion-safe:animate-fade-in">
                        {@render detail(inbox.selected)}
                    </div>
                {/key}
            {:else}
                <EmptyState icon={Bot} title="Elige un pedido" message="Toca un pedido de la lista para ver su detalle." />
            {/if}
        </aside>
    {/if}
</div>

{#if !responsive.isTablet}
    <AdaptiveSheet open={sheetOpen} onClose={() => inbox.select(null)} ariaLabel="Detalle del pedido">
        <div class="flex min-h-0 flex-1 flex-col pt-3">
            {@render detail(shown)}
        </div>
    </AdaptiveSheet>
{/if}
