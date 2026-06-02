<script lang="ts">
    import X from '@lucide/svelte/icons/x'
    import ScreenState from '$lib/components/ScreenState.svelte'
    import { getErrorMessage } from '$lib/utils/errors'
    import { formatCurrency } from '$lib/utils/numbers'
    import { formatDateTime } from '$lib/utils/dates'
    import { useDailySales } from '../hooks/useSales'
    import SaleDetailView from './SaleDetailView.svelte'

    interface Props {
        visible: boolean
        onClose: () => void
    }
    let { visible, onClose }: Props = $props()

    const query = useDailySales()
    const data = $derived($query.data)

    let detailId = $state<number | null>(null)

    // Reset del detalle al cerrar (paridad con el efecto cross-platform de pos_app).
    $effect(() => {
        if (!visible) detailId = null
    })
</script>

{#if visible}
    <div
        class="fixed inset-0 z-50 flex flex-col bg-background"
        style="padding-top:env(safe-area-inset-top)"
        role="dialog"
        aria-modal="true"
        aria-label="Tickets del día"
    >
        {#if detailId != null}
            <SaleDetailView saleId={detailId} onBack={() => (detailId = null)} />
        {:else}
            <div
                class="flex flex-row items-center justify-between border-b border-border/70 bg-card px-3 py-2"
            >
                <button
                    type="button"
                    onclick={onClose}
                    class="flex h-10 w-10 items-center justify-center active:opacity-60"
                    aria-label="Cerrar"
                >
                    <X size={22} color="hsl(215, 16%, 40%)" />
                </button>
                <span class="text-base font-bold text-foreground">Tickets del día</span>
                <div class="w-10"></div>
            </div>

            {#if $query.isLoading}
                <ScreenState kind="loading" />
            {/if}
            {#if $query.isError}
                <div class="flex flex-col items-center">
                    <ScreenState kind="error" message={getErrorMessage($query.error)} />
                    <button
                        type="button"
                        onclick={() => $query.refetch()}
                        class="rounded-full px-4 py-2 active:opacity-80"
                        style="background-color:hsla(217, 91%, 50%, 0.12)"
                    >
                        <span class="text-sm font-semibold text-primary">Reintentar</span>
                    </button>
                </div>
            {/if}
            {#if data && data.length === 0}
                <ScreenState kind="empty" message="No hay tickets hoy." />
            {/if}

            {#if data && data.length > 0}
                <div class="flex-1 overflow-y-auto px-5 pb-8">
                    {#each data as ticket (ticket.id)}
                        {@const isSale = ticket.ticketType === 'SALE'}
                        <button
                            type="button"
                            onclick={() => (detailId = ticket.id)}
                            class="block w-full text-left active:opacity-80"
                        >
                            <div
                                class="flex flex-row items-center gap-3 border-b border-border/50 py-3"
                            >
                                <div
                                    class="rounded-full px-2 py-0.5"
                                    style="background-color:{isSale
                                        ? 'hsla(158, 64%, 38%, 0.12)'
                                        : 'hsla(32, 95%, 44%, 0.14)'}"
                                >
                                    <span
                                        class="text-[10px] font-semibold {isSale
                                            ? 'text-success'
                                            : 'text-warning'}"
                                    >
                                        {isSale ? 'Venta' : 'Pedido'}
                                    </span>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <p class="truncate text-sm font-semibold text-foreground">
                                        {ticket.saleNumber ?? ticket.ticketNumber} · {ticket.customerName}
                                    </p>
                                    <p class="text-[11px] text-muted-foreground">
                                        {formatDateTime(ticket.createdAt)}
                                    </p>
                                </div>
                                <span class="text-sm font-bold text-foreground">
                                    {formatCurrency(ticket.total)}
                                </span>
                            </div>
                        </button>
                    {/each}
                </div>
            {/if}
        {/if}
    </div>
{/if}
