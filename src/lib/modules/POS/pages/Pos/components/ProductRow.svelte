<script lang="ts">
    import { Package, Plus } from '@lucide/svelte'
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

<PressableScale onclick={onPress} class="block w-full active:opacity-90">
    <div
        class="flex w-full items-center gap-3 rounded-2xl border border-border bg-card px-3.5 py-3 text-left"
        style="box-shadow: 0 4px 10px hsla(222, 47%, 11%, 0.05);"
    >
        <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style="background-color: hsla(217, 91%, 50%, 0.12);"
        >
            <Package size={18} color="hsl(217, 91%, 50%)" strokeWidth={2} />
        </div>

        <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-semibold text-foreground">{product.name}</p>
            <p class="mt-0.5 truncate text-[11px] text-muted-foreground">
                {product.sku_code ? `SKU: ${product.sku_code} · ` : ''}Stock:
                <span class="font-medium {outOfStock ? 'text-destructive' : 'text-success'}"
                    >{outOfStock ? 'Sin stock' : formatNumber(product.stock)}</span
                >{product.packaging ? ` · ${product.packaging.name}` : ''}
            </p>
        </div>

        <div class="flex shrink-0 items-center gap-3">
            <span class="text-base font-bold tabular-nums text-primary">
                {price != null ? formatCurrency(price) : '—'}
            </span>
            <span
                class="flex h-8 w-8 items-center justify-center rounded-lg"
                style="background-color: hsla(217, 91%, 50%, 0.12);"
            >
                <Plus size={16} color="hsl(217, 91%, 50%)" strokeWidth={2.4} />
            </span>
        </div>
    </div>
</PressableScale>
