<script lang="ts">
    import { Receipt, ShoppingCart, User } from '@lucide/svelte'
    import type { SaleDetail } from '$lib/api/requests/sales'
    import { formatCurrency } from '$lib/utils/numbers'

    interface Props {
        sale: SaleDetail
    }
    let { sale }: Props = $props()

    const GLASS = 'rgba(255, 255, 255, 0.16)'
    const GLASS_BORDER = 'rgba(255, 255, 255, 0.28)'

    type Pill = { label: string; dot: string | null }

    const paymentPill = (s: SaleDetail): Pill => {
        const credit = s.credit
        if (!credit || credit.status === 'PAID' || credit.balance <= 0) {
            return { label: 'Pagada', dot: 'hsl(150, 80%, 60%)' }
        }
        const overdue = credit.dueDate ? new Date(credit.dueDate) < new Date() : false
        if (overdue) return { label: 'Vencida', dot: 'hsl(0, 90%, 68%)' }
        return {
            label: credit.status === 'PARTIAL' ? 'Abono parcial' : 'Por cobrar',
            dot: 'hsl(45, 95%, 62%)'
        }
    }

    const isOrder = $derived(sale.ticketType === 'ORDER')
    // Gradiente de marca según el tipo (azul = venta, ámbar = pedido).
    const gradient = $derived(
        isOrder
            ? 'linear-gradient(135deg, hsl(38, 95%, 53%), hsl(28, 92%, 46%))'
            : 'linear-gradient(135deg, hsl(213, 94%, 57%), hsl(221, 83%, 47%))'
    )
    const eyebrow = $derived(isOrder ? 'Pedido' : 'Venta')
    const number = $derived(
        sale.ticketType === 'SALE' && sale.saleNumber ? sale.saleNumber : sale.ticketNumber
    )
    const pill = $derived(paymentPill(sale))
</script>

<div style="background:{gradient};padding:18px 24px 32px">
    <div class="mb-6 flex justify-center">
        <span class="h-1 w-10 rounded-full" style="background-color:{GLASS_BORDER}"></span>
    </div>

    <div
        class="flex h-12 w-12 items-center justify-center rounded-2xl"
        style="background-color:{GLASS};border:1px solid {GLASS_BORDER}"
    >
        {#if isOrder}
            <ShoppingCart size={24} color="#ffffff" strokeWidth={2.2} />
        {:else}
            <Receipt size={24} color="#ffffff" strokeWidth={2.2} />
        {/if}
    </div>

    <p
        class="mt-4 text-[11px] font-bold uppercase tracking-[0.18em]"
        style="color:rgba(255,255,255,0.75)"
    >
        {eyebrow} · N° {number}
    </p>
    <p class="mt-1 truncate text-[34px] font-extrabold tracking-tight text-white">
        {formatCurrency(sale.total)}
    </p>

    <div class="mt-3 flex items-center gap-1.5">
        <User size={14} color="rgba(255,255,255,0.7)" />
        <span class="flex-1 truncate text-sm" style="color:rgba(255,255,255,0.9)">
            {sale.customerName}
        </span>
    </div>

    {#if sale.ticketType === 'SALE'}
        <div class="mt-5 flex flex-wrap items-center gap-2">
            <span
                class="flex items-center gap-1.5 rounded-full px-3 py-1.5"
                style="background-color:{GLASS};border:1px solid {GLASS_BORDER}"
            >
                {#if pill.dot}
                    <span class="h-1.5 w-1.5 rounded-full" style="background-color:{pill.dot}"></span>
                {/if}
                <span class="text-[11px] font-bold uppercase tracking-wide text-white">
                    {pill.label}
                </span>
            </span>
        </div>
    {/if}
</div>
