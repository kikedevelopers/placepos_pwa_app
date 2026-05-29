<script lang="ts">
    import { Package } from '@lucide/svelte'
    import type { Product } from '$lib/api/requests/products'
    import { formatCurrency, formatNumber } from '$lib/utils/numbers'
    import PressableScale from '$lib/components/PressableScale.svelte'

    interface Props {
        product: Product
        onclick: () => void
    }
    let { product, onclick }: Props = $props()

    const LOW_STOCK_THRESHOLD = 10

    const isChild = $derived(product.parent_id !== null)
    const lowStock = $derived(product.stock_display < LOW_STOCK_THRESHOLD)
    const price = $derived(product.prices?.[0]?.sale_price)
    const meta = $derived(
        [product.sku_code || 'Sin SKU', product.packaging?.name].filter(Boolean).join(' · ')
    )
</script>

<PressableScale
    as="div"
    {onclick}
    class="block w-full text-left"
    style="box-shadow:0 4px 10px hsla(222,47%,11%,0.04)"
>
    <div class="rounded-2xl border border-border bg-card p-4">
        <div class="mb-2 flex items-center gap-3">
            <div
                class="flex h-10 w-10 items-center justify-center rounded-xl"
                style="background-color: hsla(217, 91%, 50%, 0.12)"
            >
                <Package size={18} color="hsl(217, 91%, 50%)" strokeWidth={2} />
            </div>
            <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold text-foreground">{product.name}</p>
                <p class="mt-0.5 truncate text-[11px] text-muted-foreground">{meta}</p>
            </div>
            <span
                class="rounded-full px-2 py-0.5 text-[10px] font-semibold {isChild
                    ? 'text-info'
                    : 'text-muted-foreground'}"
                style="background-color: {isChild
                    ? 'hsla(199, 89%, 45%, 0.12)'
                    : 'hsla(215, 16%, 47%, 0.12)'}"
            >
                {isChild ? 'Presentación' : 'Base'}
            </span>
        </div>

        <div class="flex items-end justify-between border-t border-border/60 pt-2">
            <div>
                <p class="text-[11px] text-muted-foreground">Existencias</p>
                <p class="text-sm font-semibold {lowStock ? 'text-destructive' : 'text-foreground'}">
                    {formatNumber(product.stock_display)}{product.packaging
                        ? ` ${product.packaging.name}`
                        : ''}
                </p>
            </div>
            <div class="text-right">
                <p class="text-[11px] text-muted-foreground">Costo → Precio</p>
                <p class="text-sm font-semibold text-foreground">
                    {formatCurrency(product.cost)} → {price != null ? formatCurrency(price) : '—'}
                </p>
            </div>
        </div>
    </div>
</PressableScale>
