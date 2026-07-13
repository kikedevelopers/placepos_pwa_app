<script lang="ts">
    import { IdCard, Phone, Truck, Weight } from '@lucide/svelte'
    import type { PurchaseDetail, PurchaseCarrierCreditStatus } from '$lib/api/requests/purchases'
    import { formatCurrency, formatNumber } from '$lib/utils/numbers'
    import CollapsibleSection from '$lib/components/TicketViewer/components/CollapsibleSection.svelte'

    interface Props {
        purchase: PurchaseDetail
    }
    let { purchase }: Props = $props()

    const carrier = $derived(purchase.carrier ?? null)
    const carrierCredit = $derived(purchase.carrier_credit ?? null)
    const carrierName = $derived(carrier?.name ?? purchase.carrier_name ?? null)
    const cost = $derived(purchase.transport_cost ?? 0)

    const STATUS_LABEL: Record<PurchaseCarrierCreditStatus, string> = {
        PENDING: 'Por pagar',
        PARTIAL: 'Abono parcial',
        PAID: 'Pagado'
    }
    const statusTone = (s: PurchaseCarrierCreditStatus): { fg: string; bg: string } =>
        s === 'PAID'
            ? { fg: 'text-success', bg: 'hsla(158, 64%, 38%, 0.14)' }
            : s === 'PARTIAL'
              ? { fg: 'text-warning', bg: 'hsla(32, 95%, 44%, 0.16)' }
              : { fg: 'text-destructive', bg: 'hsla(0, 84%, 55%, 0.12)' }
</script>

{#snippet stat(label: string, value: string, tone?: string)}
    <div class="flex items-center justify-between py-1.5">
        <span class="text-sm text-muted-foreground">{label}</span>
        <span class="text-sm font-semibold tabular-nums {tone ?? 'text-foreground'}">{value}</span>
    </div>
{/snippet}

<CollapsibleSection
    title="Transporte"
    subtitle={carrierName ?? 'Sin transportista'}
    icon={Truck}
    iconColor="hsl(217, 91%, 50%)"
    iconBg="hsla(217, 91%, 50%, 0.12)"
>
    {#snippet trailing()}
        {#if carrierCredit}
            {@const tone = statusTone(carrierCredit.status)}
            <span
                class="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide {tone.fg}"
                style="background-color:{tone.bg}"
            >
                {STATUS_LABEL[carrierCredit.status]}
            </span>
        {/if}
    {/snippet}

    {#if !carrierName && cost <= 0}
        <p class="pt-2 text-xs leading-relaxed text-muted-foreground">
            Esta compra no tiene transporte asociado.
        </p>
    {:else}
        <div class="pt-1">
            {#if carrier?.identification}
                <div class="flex items-center gap-2.5 py-1.5 text-xs">
                    <IdCard size={14} color="hsl(215, 16%, 55%)" strokeWidth={2} />
                    <span class="text-muted-foreground">Identificación:</span>
                    <span class="flex-1 truncate font-medium text-foreground"
                        >{carrier.identification}</span
                    >
                </div>
            {/if}
            {#if carrier?.phone}
                <div class="flex items-center gap-2.5 py-1.5 text-xs">
                    <Phone size={14} color="hsl(215, 16%, 55%)" strokeWidth={2} />
                    <span class="text-muted-foreground">Teléfono:</span>
                    <span class="flex-1 truncate font-medium text-foreground">{carrier.phone}</span>
                </div>
            {/if}

            <div class="mt-1 border-t border-border/50 pt-1.5">
                {@render stat('Costo del flete', formatCurrency(cost))}
                {#if purchase.total_kilos != null && purchase.total_kilos > 0}
                    <div class="flex items-center justify-between py-1.5">
                        <span class="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Weight size={13} color="hsl(215, 16%, 55%)" strokeWidth={2} /> Peso
                        </span>
                        <span class="text-sm font-semibold tabular-nums text-foreground">
                            {formatNumber(purchase.total_kilos, 2)} kg
                        </span>
                    </div>
                {/if}
            </div>

            {#if carrierCredit}
                <div class="mt-1 border-t border-border/50 pt-1.5">
                    {@render stat('Abonado al transportista', formatCurrency(carrierCredit.paid_amount))}
                    {@render stat(
                        'Saldo del flete',
                        formatCurrency(carrierCredit.balance),
                        carrierCredit.balance > 0 ? 'text-destructive' : 'text-success'
                    )}
                </div>
            {/if}
        </div>
    {/if}
</CollapsibleSection>
