<script lang="ts">
    import { ArrowLeftRight, Banknote, CreditCard, History, Wallet } from '@lucide/svelte'
    import type { SaleDetail, SalePayment } from '$lib/api/requests/sales'
    import type { IconComponent } from '$lib/types/icon'
    import { formatCurrency } from '$lib/utils/numbers'
    import { formatDateTime } from '$lib/utils/dates'
    import CollapsibleSection from './CollapsibleSection.svelte'

    interface Props {
        sale: SaleDetail
    }
    let { sale }: Props = $props()

    type Method = SalePayment['paymentMethod']
    const METHOD: Record<Method, { label: string; icon: IconComponent; fg: string; bg: string }> = {
        CASH: { label: 'Efectivo', icon: Banknote, fg: 'hsl(158, 64%, 34%)', bg: 'hsla(158, 64%, 38%, 0.12)' },
        TRANSFER: {
            label: 'Transferencia',
            icon: ArrowLeftRight,
            fg: 'hsl(217, 91%, 50%)',
            bg: 'hsla(217, 91%, 50%, 0.12)'
        },
        CREDIT: { label: 'Crédito', icon: CreditCard, fg: 'hsl(258, 70%, 56%)', bg: 'hsla(258, 70%, 56%, 0.12)' }
    }

    const fallback = { label: 'Otro', icon: Wallet, fg: 'hsl(215, 16%, 50%)', bg: 'hsla(215, 16%, 47%, 0.12)' }
    const meta = (m: Method) => METHOD[m] ?? fallback

    const payments = $derived(sale.payments)
    const count = $derived(payments.length)
    const total = $derived(payments.reduce((sum, p) => sum + p.amountPaid, 0))
</script>

<CollapsibleSection
    title="Abonos y movimientos"
    subtitle={count === 0
        ? 'Sin movimientos registrados'
        : `${count} registrado${count === 1 ? '' : 's'}`}
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
            Los pagos y movimientos aparecerán aquí cuando se registren.
        </p>
    {:else}
        <div class="flex flex-col gap-3 pt-2">
            <div>
                {#each payments as p, i (p.id)}
                    {@const m = meta(p.paymentMethod)}
                    <div
                        class="flex items-center gap-3 py-3"
                        style={i === 0 ? '' : 'border-top:1px solid hsla(215,16%,47%,0.18)'}
                    >
                        <span
                            class="flex h-9 w-9 items-center justify-center rounded-xl"
                            style="background-color:{m.bg}"
                        >
                            <m.icon size={16} color={m.fg} strokeWidth={2.2} />
                        </span>
                        <div class="min-w-0 flex-1">
                            <p class="truncate text-sm font-medium text-foreground">{m.label}</p>
                            <p class="mt-0.5 text-[11px] text-muted-foreground/80">
                                {formatDateTime(p.createdAt)}
                            </p>
                        </div>
                        <div class="flex flex-col items-end">
                            <span class="text-sm font-semibold tabular-nums text-foreground"
                                >{formatCurrency(p.amountPaid)}</span
                            >
                            {#if p.changeAmount > 0}
                                <span class="mt-0.5 text-[11px] tabular-nums text-muted-foreground">
                                    Cambio: {formatCurrency(p.changeAmount)}
                                </span>
                            {/if}
                        </div>
                    </div>
                {/each}
            </div>

            <div
                class="flex flex-col gap-1.5 rounded-xl p-3"
                style="border:1px solid hsla(215,16%,47%,0.18);background-color:hsla(215,16%,47%,0.05)"
            >
                <div class="flex items-center justify-between">
                    <span class="text-xs text-muted-foreground">Pagos realizados</span>
                    <span class="text-xs font-medium tabular-nums text-foreground"
                        >+{formatCurrency(total)}</span
                    >
                </div>
                <div class="flex items-center justify-between border-t border-border/50 pt-2">
                    <span class="text-xs font-medium text-foreground">Total consolidado</span>
                    <span class="text-sm font-semibold tabular-nums text-success"
                        >{formatCurrency(total)}</span
                    >
                </div>
            </div>
        </div>
    {/if}
</CollapsibleSection>
