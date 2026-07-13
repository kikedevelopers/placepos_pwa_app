<script lang="ts">
    import { ArrowLeftRight, Banknote, History } from '@lucide/svelte'
    import type { PurchaseDetail, PurchasePayment } from '$lib/api/requests/purchases'
    import { formatCurrency } from '$lib/utils/numbers'
    import { formatDateTime } from '$lib/utils/dates'
    import CollapsibleSection from '$lib/components/TicketViewer/components/CollapsibleSection.svelte'

    interface Props {
        purchase: PurchaseDetail
    }
    let { purchase }: Props = $props()

    const payments = $derived(purchase.payments ?? [])
    const count = $derived(payments.length)

    const isCash = (p: PurchasePayment) => p.payment_method === 'CASH'
    const methodLabel = (p: PurchasePayment): string =>
        isCash(p)
            ? 'Efectivo'
            : `Transferencia${p.bank_name ? ` · ${p.bank_name}` : ''}`
</script>

<CollapsibleSection
    title="Historial de abonos"
    subtitle={count === 0 ? 'Sin abonos registrados' : `${count} registrado${count === 1 ? '' : 's'}`}
    icon={History}
    iconColor="hsl(258, 70%, 56%)"
    iconBg="hsla(258, 70%, 56%, 0.12)"
>
    {#snippet trailing()}
        {#if count > 0}
            <span
                class="rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground"
                style="background-color: hsla(215, 16%, 47%, 0.14)">{count}</span
            >
        {/if}
    {/snippet}

    {#if count === 0}
        <p class="pt-2 text-xs leading-relaxed text-muted-foreground">
            Aún no se han registrado abonos a esta compra.
        </p>
    {:else}
        <div class="pt-1">
            {#each payments as p, i (p.id)}
                <div
                    class="flex items-center gap-3 py-3"
                    style={i === 0 ? '' : 'border-top:1px solid hsla(215,16%,47%,0.18)'}
                >
                    <span
                        class="flex h-9 w-9 items-center justify-center rounded-xl"
                        style="background-color:{isCash(p)
                            ? 'hsla(158, 64%, 38%, 0.12)'
                            : 'hsla(217, 91%, 50%, 0.12)'}"
                    >
                        {#if isCash(p)}
                            <Banknote size={16} color="hsl(158, 64%, 34%)" strokeWidth={2.2} />
                        {:else}
                            <ArrowLeftRight size={16} color="hsl(217, 91%, 50%)" strokeWidth={2.2} />
                        {/if}
                    </span>
                    <div class="min-w-0 flex-1">
                        <p class="truncate font-mono text-sm font-semibold text-foreground">
                            {p.payment_number}
                        </p>
                        <p class="truncate text-[11px] text-muted-foreground">{methodLabel(p)}</p>
                        <p class="mt-0.5 text-[11px] text-muted-foreground/80">
                            {formatDateTime(p.created_at)}{p.created_by ? ` · ${p.created_by}` : ''}
                        </p>
                    </div>
                    <span class="shrink-0 text-sm font-semibold tabular-nums text-success">
                        {formatCurrency(p.amount)}
                    </span>
                </div>
            {/each}
        </div>
    {/if}
</CollapsibleSection>
