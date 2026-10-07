<script lang="ts">
    import { Package } from '@lucide/svelte'
    import type { PosProduct } from '$lib/api/requests/pos'
    import { formatCurrency, formatNumber } from '$lib/utils/numbers'
    import PressableScale from '$lib/components/PressableScale.svelte'
    import ProductImage from '$lib/components/ProductImage.svelte'

    interface Props {
        product: PosProduct
        onPress: () => void
        /** Clic en la foto → abre la carta informativa (catálogo). */
        onShowInfo: (product: PosProduct) => void
    }

    let { product, onPress, onShowInfo }: Props = $props()

    const price = $derived(product.prices[0]?.sale_price)
    const outOfStock = $derived(product.stock <= 0)
</script>

<div
    class="relative overflow-hidden rounded-2xl border border-border bg-card"
    style="box-shadow: 0 4px 10px hsla(222, 47%, 11%, 0.05);"
>
    <!-- Foto del producto: ocupa la parte alta de borde a borde y se muestra
         COMPLETA (object-contain), nunca recortada ni deformada. Clic en la foto
         abre la carta informativa (catálogo); el resto de la card agrega. -->
    <button
        type="button"
        onclick={() => onShowInfo(product)}
        aria-label={`Ver información de ${product.name}`}
        class="relative flex h-28 w-full items-center justify-center overflow-hidden bg-secondary/40 active:opacity-80"
    >
        <div
            class="absolute right-2 top-2 z-10 rounded-full px-2 py-0.5"
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
        <ProductImage url={product.image_url} alt={product.name} class="max-h-full max-w-full object-contain p-2">
            {#snippet fallback()}
                <Package size={34} color="hsl(217, 91%, 50%)" strokeWidth={1.6} />
            {/snippet}
        </ProductImage>
    </button>

    <!-- Resto de la card: agrega al carrito / abre el configurador. -->
    <PressableScale onclick={onPress} class="block w-full text-left active:opacity-90">
        <div class="px-3.5 pb-3.5 pt-2.5">
            <p
                class="line-clamp-2 text-sm font-semibold text-foreground"
                style="min-height: 36px; line-height: 18px;"
            >
                {product.name}
            </p>
            <p class="mt-1.5 text-base font-bold text-primary">
                {price != null ? formatCurrency(price) : '—'}
            </p>
        </div>
    </PressableScale>
</div>
