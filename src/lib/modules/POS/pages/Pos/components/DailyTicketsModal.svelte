<script lang="ts">
    import { ChevronRight, Clock, Receipt, X } from '@lucide/svelte'
    import type { SaleListItem } from '$lib/api/requests/sales'
    import ScreenState from '$lib/components/ScreenState.svelte'
    import PressableScale from '$lib/components/PressableScale.svelte'
    import FadeInUp from '$lib/components/FadeInUp.svelte'
    import { ticketViewer } from '$lib/components/TicketViewer'
    import { useUserRole } from '$lib/hooks/useUserRole.svelte'
    import { getErrorMessage } from '$lib/utils/errors'
    import { formatCurrency } from '$lib/utils/numbers'
    import { formatDateTime } from '$lib/utils/dates'
    import { useDailySales } from '../hooks/useSales'

    interface Props {
        visible: boolean
        onClose: () => void
    }
    let { visible, onClose }: Props = $props()

    const query = useDailySales()
    const data = $derived($query.data ?? [])

    const role = useUserRole()
    // Igual que el TicketViewer: ganancia/margen solo owner/superadmin (o cold start).
    const canViewProfit = $derived(
        role.role == null || role.role === 'owner' || role.role === 'superadmin'
    )

    const count = $derived(data.length)
    const totalSum = $derived(data.reduce((a, t) => a + t.total, 0))
    const profitSum = $derived(data.reduce((a, t) => a + t.profit, 0))

    const isSale = (t: SaleListItem) => t.ticketType === 'SALE'
    const number = (t: SaleListItem) => t.saleNumber ?? t.ticketNumber
</script>

{#if visible}
    <div
        class="fixed inset-0 z-50 flex flex-col"
        style="padding-top:env(safe-area-inset-top); background-color: hsl(214, 22%, 95%)"
        role="dialog"
        aria-modal="true"
        aria-label="Tickets del día"
    >
        <!-- Header -->
        <div
            class="flex flex-row items-center justify-between border-b border-border/60 bg-card px-3 py-2"
        >
            <button
                type="button"
                onclick={onClose}
                class="flex h-10 w-10 items-center justify-center rounded-full active:opacity-60"
                aria-label="Cerrar"
            >
                <X size={22} color="hsl(215, 16%, 40%)" />
            </button>
            <span class="text-base font-bold text-foreground">Tickets del día</span>
            <div class="w-10"></div>
        </div>

        {#if $query.isLoading}
            <ScreenState kind="loading" />
        {:else if $query.isError}
            <div class="flex flex-1 flex-col items-center justify-center gap-3">
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
        {:else if count === 0}
            <ScreenState kind="empty" message="No hay tickets hoy." />
        {:else}
            <div class="flex-1 overflow-y-auto pb-8">
                <!-- Resumen del día -->
                <div class="px-5 pb-1 pt-4">
                    <div
                        class="relative overflow-hidden rounded-2xl border border-border bg-card p-4"
                        style="box-shadow:0 8px 18px hsla(222,47%,11%,0.06)"
                    >
                        <div
                            class="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full opacity-70 blur-2xl"
                            style="background:radial-gradient(circle, hsla(217,91%,50%,0.16), transparent 70%)"
                            aria-hidden="true"
                        ></div>
                        <div class="flex items-end justify-between">
                            <div>
                                <p
                                    class="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
                                >
                                    Tickets de hoy
                                </p>
                                <p class="mt-0.5 text-3xl font-bold tracking-tight text-foreground">
                                    {count}
                                </p>
                            </div>
                            <div class="text-right">
                                <p class="text-[10px] text-muted-foreground">Total facturado</p>
                                <p class="text-xl font-bold tabular-nums text-foreground">
                                    {formatCurrency(totalSum)}
                                </p>
                                {#if canViewProfit}
                                    <p
                                        class="mt-0.5 text-[11px] font-semibold tabular-nums {profitSum >=
                                        0
                                            ? 'text-success'
                                            : 'text-destructive'}"
                                    >
                                        Ganancia {formatCurrency(profitSum)}
                                    </p>
                                {/if}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Lista -->
                <div class="flex flex-col gap-2.5 px-5 pt-3">
                    {#each data as ticket, i (ticket.id)}
                        {@const sale = isSale(ticket)}
                        <FadeInUp index={Math.min(i, 8)}>
                            <PressableScale
                                as="div"
                                onclick={() => ticketViewer.open(ticket.id)}
                                ariaLabel={`Ver ticket ${number(ticket)}`}
                                class="block w-full text-left"
                                style="box-shadow:0 4px 10px hsla(222,47%,11%,0.05)"
                            >
                                <div class="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5">
                                    <!-- Chip de tipo -->
                                    <span
                                        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                                        style="background-color:{sale
                                            ? 'hsla(158,64%,38%,0.12)'
                                            : 'hsla(32,95%,44%,0.14)'}"
                                    >
                                        {#if sale}
                                            <Receipt size={20} color="hsl(158, 64%, 38%)" strokeWidth={2} />
                                        {:else}
                                            <Clock size={20} color="hsl(32, 95%, 44%)" strokeWidth={2} />
                                        {/if}
                                    </span>

                                    <div class="min-w-0 flex-1">
                                        <div class="flex items-center gap-2">
                                            <span
                                                class="rounded-md px-1.5 py-0.5 text-[10px] font-bold {sale
                                                    ? 'text-success'
                                                    : 'text-warning'}"
                                                style="background-color:{sale
                                                    ? 'hsla(158,64%,38%,0.12)'
                                                    : 'hsla(32,95%,44%,0.14)'}"
                                            >
                                                {sale ? 'VENTA' : 'PEDIDO'}
                                            </span>
                                            <span
                                                class="truncate font-mono text-sm font-semibold text-foreground"
                                            >
                                                {number(ticket)}
                                            </span>
                                        </div>
                                        <p class="mt-1 truncate text-[12px] text-foreground/80">
                                            {ticket.customerName}
                                        </p>
                                        <p class="mt-0.5 text-[11px] text-muted-foreground">
                                            {formatDateTime(ticket.createdAt)}
                                        </p>
                                    </div>

                                    <div class="flex shrink-0 flex-col items-end">
                                        <span class="text-base font-bold tabular-nums text-foreground">
                                            {formatCurrency(ticket.total)}
                                        </span>
                                        {#if canViewProfit}
                                            <span
                                                class="mt-0.5 text-[11px] font-medium tabular-nums {ticket.profit >=
                                                0
                                                    ? 'text-success'
                                                    : 'text-destructive'}"
                                            >
                                                {formatCurrency(ticket.profit)} · {ticket.margin.toFixed(
                                                    1
                                                )}%
                                            </span>
                                        {/if}
                                    </div>

                                    <ChevronRight size={18} color="hsl(215, 16%, 65%)" strokeWidth={2} />
                                </div>
                            </PressableScale>
                        </FadeInUp>
                    {/each}
                </div>
            </div>
        {/if}
    </div>
{/if}
