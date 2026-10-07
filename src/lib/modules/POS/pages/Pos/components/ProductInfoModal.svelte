<script lang="ts">
    import Package from '@lucide/svelte/icons/package'
    import Tag from '@lucide/svelte/icons/tag'
    import X from '@lucide/svelte/icons/x'
    import { fade, scale } from 'svelte/transition'
    import type { PosProduct } from '$lib/api/requests/pos'
    import { formatCurrency, formatNumber } from '$lib/utils/numbers'
    import { resolveImageSrc } from '$lib/utils/productImage'
    import { env } from '$lib/constants/env'
    import ProductImage from '$lib/components/ProductImage.svelte'

    interface Props {
        /** Producto a mostrar. `null` = cerrado. */
        product: PosProduct | null
        onClose: () => void
    }

    let { product, onClose }: Props = $props()

    let zoomOpen = $state(false)

    const prices = $derived(product?.prices ?? [])
    const firstPrice = $derived(prices[0]?.sale_price)
    const otherPrices = $derived(prices.slice(1, 4))
    const description = $derived(product?.description?.trim())
    const inStock = $derived((product?.stock ?? 0) > 0)
    // Solo se puede ampliar si hay una imagen real.
    const zoomSrc = $derived(resolveImageSrc(product?.image_url, env.apiBaseUrl))
    const canZoom = $derived(Boolean(zoomSrc))

    const close = () => {
        zoomOpen = false
        onClose()
    }
</script>

{#if product}
    <!-- Carta informativa (catálogo). Overlay centrado. -->
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-5"
        transition:fade={{ duration: 150 }}
    >
        <button
            type="button"
            class="absolute inset-0 bg-black/50 backdrop-blur-sm"
            aria-label="Cerrar"
            onclick={close}
        ></button>

        <div
            class="relative z-10 flex w-full max-w-sm flex-col overflow-hidden rounded-3xl border border-border/60 bg-card shadow-2xl"
            transition:scale={{ duration: 180, start: 0.95 }}
        >
            <!-- Botón cerrar -->
            <button
                type="button"
                onclick={close}
                class="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-background/70 text-muted-foreground backdrop-blur-md active:opacity-70"
                aria-label="Cerrar"
            >
                <X size={18} />
            </button>

            <!-- HERO: imagen grande. Con foto es un botón que abre el visor a
                 tamaño completo; sin foto cae al marcador. -->
            {#if canZoom}
                <button
                    type="button"
                    onclick={() => (zoomOpen = true)}
                    aria-label={`Ampliar imagen de ${product.name}`}
                    class="relative block h-56 w-full overflow-hidden bg-gradient-to-br from-primary/15 via-secondary to-background"
                >
                    <div class="absolute left-4 top-4 z-10">
                        <span
                            class="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-semibold shadow-sm backdrop-blur-md"
                        >
                            <span
                                class="h-1.5 w-1.5 rounded-full {inStock
                                    ? 'bg-success'
                                    : 'bg-destructive'}"
                            ></span>
                            <span class={inStock ? 'text-foreground/80' : 'text-destructive'}>
                                Stock: {formatNumber(product.stock)}
                            </span>
                        </span>
                    </div>
                    <div class="flex h-full w-full items-center justify-center p-8">
                        <ProductImage
                            url={product.image_url}
                            alt={product.name}
                            class="max-h-full max-w-full object-contain"
                        >
                            {#snippet fallback()}
                                <Package size={80} class="text-muted-foreground/40" />
                            {/snippet}
                        </ProductImage>
                    </div>
                </button>
            {:else}
                <div
                    class="relative h-56 w-full overflow-hidden bg-gradient-to-br from-primary/15 via-secondary to-background"
                >
                    <div class="absolute left-4 top-4 z-10">
                        <span
                            class="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-semibold shadow-sm backdrop-blur-md"
                        >
                            <span
                                class="h-1.5 w-1.5 rounded-full {inStock
                                    ? 'bg-success'
                                    : 'bg-destructive'}"
                            ></span>
                            <span class={inStock ? 'text-foreground/80' : 'text-destructive'}>
                                Stock: {formatNumber(product.stock)}
                            </span>
                        </span>
                    </div>
                    <div class="flex h-full w-full items-center justify-center p-8">
                        <ProductImage
                            url={product.image_url}
                            alt={product.name}
                            class="max-h-full max-w-full object-contain"
                        >
                            {#snippet fallback()}
                                <Package size={80} class="text-muted-foreground/40" />
                            {/snippet}
                        </ProductImage>
                    </div>
                </div>
            {/if}

            <!-- BODY -->
            <div class="p-6">
                {#if product.sku_code}
                    <p
                        class="mb-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground/70"
                    >
                        {product.sku_code}
                    </p>
                {/if}
                <h2 class="text-2xl font-bold leading-tight tracking-tight text-foreground">
                    {product.name}
                </h2>

                {#if typeof firstPrice === 'number'}
                    <div class="mt-4 flex items-end justify-between gap-3">
                        <div>
                            <p
                                class="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70"
                            >
                                Precio
                            </p>
                            <p
                                class="flex items-center gap-1.5 text-3xl font-extrabold tracking-tight text-success"
                            >
                                <Tag size={20} />
                                {formatCurrency(firstPrice)}
                            </p>
                        </div>
                        {#if otherPrices.length > 0}
                            <div class="flex flex-wrap justify-end gap-1.5">
                                {#each otherPrices as p, i (i)}
                                    <span
                                        class="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-foreground/70"
                                    >
                                        {formatCurrency(p.sale_price)}
                                    </span>
                                {/each}
                            </div>
                        {/if}
                    </div>
                {/if}

                <div class="mt-5 border-t border-border/60 pt-4">
                    <p
                        class="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70"
                    >
                        Descripción
                    </p>
                    {#if description}
                        <p class="whitespace-pre-line text-sm leading-relaxed text-foreground/80">
                            {description}
                        </p>
                    {:else}
                        <p class="text-sm italic text-muted-foreground/60">
                            Este producto no tiene descripción.
                        </p>
                    {/if}
                </div>
            </div>
        </div>
    </div>

    <!-- Visor a tamaño completo -->
    {#if canZoom && zoomOpen}
        <div
            class="fixed inset-0 z-[60] flex items-center justify-center p-4"
            transition:fade={{ duration: 150 }}
        >
            <button
                type="button"
                class="absolute inset-0 bg-black/85"
                aria-label="Cerrar imagen"
                onclick={() => (zoomOpen = false)}
            ></button>
            <button
                type="button"
                onclick={() => (zoomOpen = false)}
                class="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white active:opacity-70"
                style="top: calc(env(safe-area-inset-top) + 12px)"
                aria-label="Cerrar imagen"
            >
                <X size={22} />
            </button>
            <img
                src={zoomSrc}
                alt={`${product.name} (imagen completa)`}
                class="relative z-0 max-h-[90dvh] max-w-[95vw] rounded-lg object-contain shadow-2xl"
            />
        </div>
    {/if}
{/if}
