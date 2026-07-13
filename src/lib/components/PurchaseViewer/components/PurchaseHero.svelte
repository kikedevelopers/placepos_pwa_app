<script lang="ts">
    import { ShoppingBag, Truck } from '@lucide/svelte'
    import type { PurchaseDetail } from '$lib/api/requests/purchases'
    import { formatCurrency } from '$lib/utils/numbers'
    import { deliveryPill, paymentPill, type Pill, type PillTone } from '../utils/purchaseSummary'

    interface Props {
        purchase: PurchaseDetail
    }
    let { purchase }: Props = $props()

    const GLASS = 'rgba(255, 255, 255, 0.16)'
    const GLASS_BORDER = 'rgba(255, 255, 255, 0.28)'

    // Gradiente azul (marca de compras en la PWA).
    const gradient = 'linear-gradient(135deg, hsl(213, 94%, 57%), hsl(221, 83%, 47%))'

    const DOT: Record<PillTone, string> = {
        success: 'hsl(150, 80%, 60%)',
        warning: 'hsl(45, 95%, 62%)',
        danger: 'hsl(0, 90%, 68%)'
    }

    const delivery = $derived<Pill>(deliveryPill(purchase.status))
    const payment = $derived<Pill>(paymentPill(purchase.credit))
    const pills = $derived<Pill[]>([delivery, payment])
</script>

<div style="background:{gradient};padding:18px 24px 32px">
    <div class="mb-6 flex justify-center">
        <span class="h-1 w-10 rounded-full" style="background-color:{GLASS_BORDER}"></span>
    </div>

    <div
        class="flex h-12 w-12 items-center justify-center rounded-2xl"
        style="background-color:{GLASS};border:1px solid {GLASS_BORDER}"
    >
        <ShoppingBag size={24} color="#ffffff" strokeWidth={2.2} />
    </div>

    <p
        class="mt-4 text-[11px] font-bold uppercase tracking-[0.18em]"
        style="color:rgba(255,255,255,0.75)"
    >
        Compra · N° {purchase.purchase_number}
    </p>
    <p class="mt-1 truncate text-[34px] font-extrabold tracking-tight text-white">
        {formatCurrency(purchase.total)}
    </p>

    <div class="mt-3 flex items-center gap-1.5">
        <Truck size={14} color="rgba(255,255,255,0.7)" />
        <span class="flex-1 truncate text-sm" style="color:rgba(255,255,255,0.9)">
            {purchase.supplier_name}
        </span>
    </div>

    <div class="mt-5 flex flex-wrap items-center gap-2">
        {#each pills as pill (pill.label)}
            <span
                class="flex items-center gap-1.5 rounded-full px-3 py-1.5"
                style="background-color:{GLASS};border:1px solid {GLASS_BORDER}"
            >
                <span class="h-1.5 w-1.5 rounded-full" style="background-color:{DOT[pill.tone]}"></span>
                <span class="text-[11px] font-bold uppercase tracking-wide text-white">
                    {pill.label}
                </span>
            </span>
        {/each}
    </div>
</div>
