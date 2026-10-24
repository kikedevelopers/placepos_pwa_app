<script lang="ts">
    import { Package } from '@lucide/svelte'
    import type { Product } from '$lib/api/requests/products'
    import ProductImage from '$lib/components/ProductImage.svelte'
    import { Money, TONE_TEXT } from '$lib/components/premium'
    import { cn } from '$lib/utils'
    import { formatCurrency, formatNumber } from '$lib/utils/numbers'
    import { stockState } from '../utils/inventoryList'

    /**
     * Fila del inventario dentro de una lista agrupada VIRTUALIZADA: cada fila
     * pinta su propio fondo y se redondea si es la primera o la última, así el
     * listado se ve como una sola tarjeta aunque solo existan en el DOM las
     * filas visibles.
     */
    interface Props {
        product: Product
        first: boolean
        last: boolean
        onclick?: () => void
    }
    let { product, first, last, onclick }: Props = $props()

    const isChild = $derived(product.parent_id !== null)
    const price = $derived(product.prices?.[0]?.sale_price)
    const stock = $derived(stockState(product.stock_display))
    const unit = $derived(product.packaging?.name ?? '')
    const detail = $derived(
        [isChild ? 'Presentación' : null, product.sku_code, `Costo ${formatCurrency(product.cost)}`].filter(Boolean).join(' · ')
    )
</script>

<button
    type="button"
    {onclick}
    disabled={!onclick}
    aria-label={`${product.name}, existencias ${formatNumber(product.stock_display)} ${unit}`}
    class={cn(
        'relative flex h-[72px] w-full items-center gap-3 bg-card px-4 text-left transition-colors duration-100 active:bg-muted disabled:active:bg-card',
        first && 'rounded-t-[22px]',
        last && 'rounded-b-[22px]',
        !first && "before:absolute before:left-[72px] before:right-0 before:top-0 before:h-px before:scale-y-[0.6] before:bg-border/70 before:content-['']"
    )}
>
    <span class="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-foreground/[0.05] text-muted-foreground">
        <ProductImage url={product.image_url} alt={product.name} class="h-full w-full object-cover">
            {#snippet fallback()}
                <Package size={19} strokeWidth={1.9} />
            {/snippet}
        </ProductImage>
    </span>
    <span class="min-w-0 flex-1">
        <span class="block truncate text-[14.5px] font-medium text-foreground">{product.name}</span>
        <span class="mt-0.5 block truncate text-[12px] text-muted-foreground">{detail}</span>
    </span>
    <span class="flex max-w-[42%] shrink-0 flex-col items-end">
        {#if price != null}
            <Money value={price} class="text-[15px] font-semibold text-foreground" />
        {:else}
            <span class="text-[13px] text-muted-foreground">Sin precio</span>
        {/if}
        <span class={cn('mt-0.5 max-w-full truncate text-[12px] font-medium tabular-nums', stock.tone === 'neutral' ? 'text-muted-foreground' : TONE_TEXT[stock.tone])}>
            {formatNumber(product.stock_display)} {unit}
        </span>
    </span>
</button>
