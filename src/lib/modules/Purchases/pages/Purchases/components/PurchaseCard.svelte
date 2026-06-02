<script lang="ts">
    import { Truck } from '@lucide/svelte'
    import type { Purchase } from '$lib/api/requests'
    import { formatCurrency } from '$lib/utils/numbers'
    import { formatShortDate } from '$lib/utils/dates'

    interface Props {
        purchase: Purchase
    }
    let { purchase }: Props = $props()

    const balance = $derived(purchase.credit?.balance ?? 0)
    const paid = $derived(balance <= 0)
    const received = $derived(purchase.status === 'RECEIVED')
    const meta = $derived(
        [`COMP ${purchase.purchase_number}`, formatShortDate(purchase.created_at), purchase.created_by]
            .filter(Boolean)
            .join(' · ')
    )
</script>

<div
    class="rounded-2xl border border-border bg-card p-4"
    style="box-shadow:0 4px 10px hsla(222,47%,11%,0.04)"
>
    <div class="mb-2 flex items-center gap-3">
        <div
            class="flex h-10 w-10 items-center justify-center rounded-xl"
            style="background-color:hsla(217, 91%, 50%, 0.12)"
        >
            <Truck size={18} color="hsl(217, 91%, 50%)" strokeWidth={2} />
        </div>
        <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-semibold text-foreground">{purchase.supplier_name}</p>
            <p class="mt-0.5 truncate text-[11px] text-muted-foreground">{meta}</p>
        </div>
        <div
            class="rounded-full px-2 py-0.5"
            style="background-color:{received
                ? 'hsla(158, 64%, 38%, 0.12)'
                : 'hsla(32, 95%, 44%, 0.14)'}"
        >
            <span
                class="text-[10px] font-semibold {received ? 'text-success' : 'text-warning'}"
            >
                {received ? 'Recibido' : 'Pendiente'}
            </span>
        </div>
    </div>

    <div class="flex items-end justify-between border-t border-border/60 pt-2">
        <div>
            <p class="text-[11px] text-muted-foreground">Total</p>
            <p class="text-sm font-semibold text-foreground">{formatCurrency(purchase.total)}</p>
        </div>
        <div class="flex flex-col items-end">
            <p class="text-[11px] text-muted-foreground">Saldo</p>
            {#if paid}
                <p class="text-sm font-bold text-success">Pagada</p>
            {:else}
                <p class="text-sm font-bold text-destructive">{formatCurrency(balance)}</p>
            {/if}
        </div>
    </div>
</div>
