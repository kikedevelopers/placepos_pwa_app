<script lang="ts">
    import { Package } from '@lucide/svelte'
    import type { PosProduct } from '$lib/api/requests/pos'
    import { formatCurrency, formatNumber } from '$lib/utils/numbers'
    import PressableScale from '$lib/components/PressableScale.svelte'

    interface Props {
        product: PosProduct
        onPress: () => void
    }

    let { product, onPress }: Props = $props()

    const price = $derived(product.prices[0]?.sale_price)
    const outOfStock = $derived(product.stock <= 0)
</script>

<PressableScale onclick={onPress} class="flex-1 w-full active:opacity-90">
    <div
        class="bg-card rounded-2xl border border-border p-3.5"
        style="box-shadow: 0 4px 10px hsla(222, 47%, 11%, 0.05);"
    >
        <div class="flex flex-row items-center justify-between mb-2.5">
            <div
                class="w-9 h-9 rounded-xl flex items-center justify-center"
                style="background-color: hsla(217, 91%, 50%, 0.12);"
            >
                <Package size={18} color="hsl(217, 91%, 50%)" strokeWidth={2} />
            </div>
            <div
                class="rounded-full px-2 py-0.5"
                style="background-color: {outOfStock
                    ? 'hsla(0, 84%, 55%, 0.12)'
                    : 'hsla(215, 16%, 47%, 0.10)'};"
            >
                <span
                    class="text-[10px] font-semibold {outOfStock
                        ? 'text-destructive'
                        : 'text-muted-foreground'}"
                >
                    {outOfStock ? 'Sin stock' : formatNumber(product.stock)}
                </span>
            </div>
        </div>

        <p
            class="text-foreground text-sm font-semibold line-clamp-2"
            style="min-height: 36px; line-height: 18px;"
        >
            {product.name}
        </p>

        <p class="text-primary text-base font-bold mt-1.5">
            {price != null ? formatCurrency(price) : '—'}
        </p>
    </div>
</PressableScale>
