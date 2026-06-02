<script lang="ts">
    import ArrowLeft from '@lucide/svelte/icons/arrow-left'
    import { useProfile } from '$lib/hooks/useProfile'
    import PrimaryButton from '$lib/components/PrimaryButton.svelte'
    import ScreenState from '$lib/components/ScreenState.svelte'
    import { getErrorMessage } from '$lib/utils/errors'
    import { formatCurrency, formatNumber } from '$lib/utils/numbers'
    import { formatDateTime } from '$lib/utils/dates'
    import { buildReceipt } from '$lib/utils/receipt'
    import { useSale } from '$lib/modules/POS/pages/Pos/hooks/useSales'

    interface Props {
        saleId: number
        onBack: () => void
    }
    let { saleId, onBack }: Props = $props()

    const METHOD_LABEL: Record<string, string> = {
        CASH: 'Efectivo',
        TRANSFER: 'Transferencia',
        CREDIT: 'Crédito'
    }
    const SECTION = 'text-[11px] uppercase text-muted-foreground/70 mb-1 tracking-[1px]'

    const saleQuery = useSale(() => saleId)
    const profileQuery = useProfile()

    const sale = $derived($saleQuery.data)
    const company = $derived($profileQuery.data?.payload?.company_profile?.primary?.name ?? '')

    const share = async () => {
        if (!sale) return
        const message = buildReceipt(sale, company)
        try {
            if (typeof navigator !== 'undefined' && navigator.share) {
                await navigator.share({ text: message })
                return
            }
            if (typeof navigator !== 'undefined' && navigator.clipboard) {
                await navigator.clipboard.writeText(message)
            }
        } catch {
            // El usuario canceló o el share no está disponible; sin acción.
        }
    }
</script>

<div class="flex flex-1 flex-col">
    <div class="flex flex-row items-center gap-2 border-b border-border/70 bg-card px-3 py-2">
        <button
            type="button"
            onclick={onBack}
            class="flex h-10 w-10 items-center justify-center active:opacity-60"
            aria-label="Volver"
        >
            <ArrowLeft size={22} color="hsl(215, 16%, 40%)" />
        </button>
        <span class="text-base font-bold text-foreground">Detalle del ticket</span>
    </div>

    {#if $saleQuery.isLoading}
        <ScreenState kind="loading" />
    {/if}
    {#if $saleQuery.isError || (!$saleQuery.isLoading && !sale)}
        <ScreenState kind="error" message={getErrorMessage($saleQuery.error)} />
    {/if}

    {#if sale}
        <div class="flex flex-1 flex-col overflow-y-auto">
            <div class="flex flex-col gap-4 p-5">
                <div class="rounded-2xl border border-border bg-card p-4">
                    <div class="flex flex-row items-center justify-between">
                        <span class="text-base font-bold text-foreground">
                            {sale.saleNumber ?? sale.ticketNumber}
                        </span>
                        <div
                            class="rounded-full px-2 py-0.5"
                            style="background-color:{sale.ticketType === 'SALE'
                                ? 'hsla(158, 64%, 38%, 0.12)'
                                : 'hsla(32, 95%, 44%, 0.14)'}"
                        >
                            <span
                                class="text-[10px] font-semibold {sale.ticketType === 'SALE'
                                    ? 'text-success'
                                    : 'text-warning'}"
                            >
                                {sale.ticketType === 'SALE' ? 'Venta' : 'Pedido'}
                            </span>
                        </div>
                    </div>
                    <span class="mt-1 block text-xs text-muted-foreground">
                        {formatDateTime(sale.createdAt)} · {sale.customerName}
                    </span>
                </div>

                <div class="rounded-2xl border border-border bg-card p-4">
                    <span class={SECTION}>Productos</span>
                    {#each sale.lines as l (l.id)}
                        <div class="flex flex-row items-center justify-between py-1.5">
                            <span class="flex-1 truncate pr-3 text-sm text-foreground">
                                {formatNumber(l.quantity)} × {l.name}
                            </span>
                            <span class="text-sm font-semibold text-foreground">
                                {formatCurrency(l.total)}
                            </span>
                        </div>
                    {/each}
                    <div
                        class="mt-1 flex flex-row items-center justify-between border-t border-border/60 pt-2"
                    >
                        <span class="text-sm font-semibold text-foreground">Total</span>
                        <span class="text-base font-bold text-primary">
                            {formatCurrency(sale.total)}
                        </span>
                    </div>
                </div>

                {#if sale.payments.length > 0}
                    <div class="rounded-2xl border border-border bg-card p-4">
                        <span class={SECTION}>Pagos</span>
                        {#each sale.payments as p (p.id)}
                            <div class="flex flex-row items-center justify-between py-1.5">
                                <span class="text-sm text-muted-foreground">
                                    {METHOD_LABEL[p.paymentMethod] ?? p.paymentMethod}{p.changeAmount >
                                    0
                                        ? ` · cambio ${formatCurrency(p.changeAmount)}`
                                        : ''}
                                </span>
                                <span class="text-sm font-semibold text-foreground">
                                    {formatCurrency(p.amountPaid)}
                                </span>
                            </div>
                        {/each}
                    </div>
                {/if}

                {#if sale.credit}
                    <div
                        class="rounded-2xl border p-4"
                        style="background-color:hsla(32, 95%, 44%, 0.08);border-color:hsla(32, 95%, 44%, 0.30)"
                    >
                        <span class={SECTION}>Crédito</span>
                        <div class="flex flex-row items-center justify-between py-1">
                            <span class="text-sm text-muted-foreground">Saldo</span>
                            <span class="text-sm font-bold text-warning">
                                {formatCurrency(sale.credit.balance)}
                            </span>
                        </div>
                        <span class="text-[11px] text-muted-foreground">
                            Vence {sale.credit.dueDate || '—'}
                        </span>
                    </div>
                {/if}
            </div>
        </div>

        <div class="border-t border-border/70 bg-card px-5 py-3">
            <PrimaryButton label="Compartir recibo" onclick={share} />
        </div>
    {/if}
</div>
