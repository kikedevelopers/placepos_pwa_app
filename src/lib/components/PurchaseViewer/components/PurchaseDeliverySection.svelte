<script lang="ts">
    import { CalendarClock, Clock, PackageCheck, User } from '@lucide/svelte'
    import type { PurchaseDetail } from '$lib/api/requests/purchases'
    import { formatDateTime } from '$lib/utils/dates'
    import CollapsibleSection from '$lib/components/TicketViewer/components/CollapsibleSection.svelte'

    interface Props {
        purchase: PurchaseDetail
    }
    let { purchase }: Props = $props()

    const received = $derived(purchase.status === 'RECEIVED')
</script>

<CollapsibleSection
    title="Entrega"
    subtitle={received ? 'Recibida' : 'Pendiente de entrega'}
    icon={received ? PackageCheck : Clock}
    iconColor={received ? 'hsl(158, 64%, 34%)' : 'hsl(32, 95%, 44%)'}
    iconBg={received ? 'hsla(158, 64%, 38%, 0.12)' : 'hsla(32, 95%, 44%, 0.14)'}
>
    {#snippet trailing()}
        <span
            class="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide {received
                ? 'text-success'
                : 'text-warning'}"
            style="background-color:{received
                ? 'hsla(158, 64%, 38%, 0.14)'
                : 'hsla(32, 95%, 44%, 0.16)'}"
        >
            {received ? 'Recibida' : 'Pendiente'}
        </span>
    {/snippet}

    {#if received && (purchase.received_by || purchase.received_at)}
        <div class="flex flex-col gap-2 pt-2">
            {#if purchase.received_by}
                <div class="flex items-center gap-2.5 text-xs">
                    <User size={14} color="hsl(215, 16%, 55%)" strokeWidth={2} />
                    <span class="text-muted-foreground">Receptor:</span>
                    <span class="flex-1 truncate font-medium text-foreground"
                        >{purchase.received_by}</span
                    >
                </div>
            {/if}
            {#if purchase.received_at}
                <div class="flex items-center gap-2.5 text-xs">
                    <CalendarClock size={14} color="hsl(215, 16%, 55%)" strokeWidth={2} />
                    <span class="text-muted-foreground">Recepción:</span>
                    <span class="flex-1 truncate font-medium text-foreground"
                        >{formatDateTime(purchase.received_at)}</span
                    >
                </div>
            {/if}
        </div>
    {:else if received}
        <p class="pt-2 text-xs leading-relaxed text-muted-foreground">
            Sin metadatos de recepción.
        </p>
    {:else}
        <p class="pt-2 text-xs leading-relaxed text-muted-foreground">
            Marca la compra como recibida para cargar la mercancía al inventario.
        </p>
    {/if}
</CollapsibleSection>
