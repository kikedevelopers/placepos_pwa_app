<script lang="ts">
    import { Package, Plus } from '@lucide/svelte'
    import type { PosProduct } from '$lib/api/requests/pos'
    import { formatCurrency, formatNumber } from '$lib/utils/numbers'
    import PressableScale from '$lib/components/PressableScale.svelte'
    import ProductImage from '$lib/components/ProductImage.svelte'

    interface Props {
        product: PosProduct
        onPress: () => void
        /** Clic en la miniatura → abre la carta informativa (catálogo). */
        onShowInfo: (product: PosProduct) => void
    }
    let { product, onPress, onShowInfo }: Props = $props()

    const price = $derived(product.prices[0]?.sale_price)
    const outOfStock = $derived(product.stock <= 0)
</script>

<div
    class="flex w-full items-center gap-3 rounded-2xl border border-border bg-card px-3.5 py-3 text-left"
    style="box-shadow: 0 4px 10px hsla(222, 47%, 11%, 0.05);"
>
    <!-- Miniatura del producto: clic abre la carta informativa. -->
    <button
        type="button"
        onclick={() => onShowInfo(product)}
        aria-label={`Ver información de ${product.name}`}
        class="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary/40 active:opacity-70"
    >
        <ProductImage url={product.image_url} alt={product.name} class="max-h-full max-w-full object-contain p-0.5">
            {#snippet fallback()}
                <Package size={18} color="hsl(217, 91%, 50%)" strokeWidth={2} />
            {/snippet}
        </ProductImage>
    </button>

    <!-- Nombre / SKU / stock: abre el configurador. -->
    <PressableScale onclick={onPress} class="block min-w-0 flex-1 text-left active:opacity-90">
        <p class="truncate text-sm font-semibold text-foreground">{product.name}</p>
        <p class="mt-0.5 truncate text-[11px] text-muted-foreground">
            {product.sku_code ? `SKU: ${product.sku_code} · ` : ''}Stock:
            <span class="font-medium {outOfStock ? 'text-destructive' : 'text-success'}"
                >{outOfStock ? 'Sin stock' : formatNumber(product.stock)}</span
            >{product.packaging ? ` · ${product.packaging.name}` : ''}
        </p>
    </PressableScale>

    <div class="flex shrink-0 items-center gap-3">
        <span class="text-base font-bold tabular-nums text-primary">
            {price != null ? formatCurrency(price) : '—'}
        </span>
        <PressableScale onclick={onPress} class="active:opacity-80">
            <span
                class="flex h-8 w-8 items-center justify-center rounded-lg"
                style="background-color: hsla(217, 91%, 50%, 0.12);"
            >
                <Plus size={16} color="hsl(217, 91%, 50%)" strokeWidth={2.4} />
            </span>
        </PressableScale>
    </div>
</div>
