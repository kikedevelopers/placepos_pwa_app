<script lang="ts">
    import { Package } from '@lucide/svelte'
    import type { PosProduct } from '$lib/api/requests/pos'
    import { formatCurrency } from '$lib/utils/numbers'
    import { cn } from '$lib/utils'
    import PressableScale from '$lib/components/PressableScale.svelte'
    import ProductImage from '$lib/components/ProductImage.svelte'

    interface Props {
        product: PosProduct
        onclick: () => void
    }
    let { product, onclick }: Props = $props()

    const price = $derived(product.prices[0]?.sale_price)
    const outOfStock = $derived(product.stock <= 0)
</script>

<PressableScale
    {onclick}
    as="button"
    ariaLabel="Ver detalle de {product.name}"
    class="block w-full overflow-hidden rounded-3xl border border-border bg-card text-left"
    style="box-shadow:0 8px 20px hsla(222,47%,11%,0.08)"
>
    <div class="relative aspect-[4/5] w-full overflow-hidden bg-secondary">
        <div class={cn('h-full w-full', outOfStock && 'grayscale')}>
            <ProductImage
                url={product.image_url}
                alt={product.name}
                class="h-full w-full object-cover"
            >
                {#snippet fallback()}
                    <div
                        class="flex h-full w-full items-center justify-center"
                        style="background:linear-gradient(135deg,hsl(213,94%,60%),hsl(221,83%,45%))"
                    >
                        <Package size={34} color="white" strokeWidth={1.6} />
                    </div>
                {/snippet}
            </ProductImage>
        </div>

        <!-- Scrim más alto y más oscuro: el nombre y el precio deben leerse a
             primera vista, sobre CUALQUIER foto. -->
        <div
            class="pointer-events-none absolute inset-x-0 bottom-0 h-3/4"
            style="background:linear-gradient(to top, hsla(222,47%,4%,0.92), hsla(222,47%,4%,0.35) 55%, transparent)"
        ></div>

        {#if outOfStock}
            <span
                class="absolute right-2.5 top-2.5 rounded-full px-2.5 py-1 text-[11px] font-bold text-white"
                style="background-color:hsla(0,84%,45%,0.92)"
            >
                Agotado
            </span>
        {/if}

        <!--
            Jerarquía "fintech": el NÚMERO manda (grande, negro, protagonista,
            como un saldo), el nombre es apenas una etiqueta pequeña y liviana
            arriba — no dos elementos gruesos peleando por la atención. Sin
            píldora de fondo en el precio: el scrim de abajo ya garantiza
            contraste por sí solo, y un texto plano se siente más "dato" que
            "botón" (esto es un catálogo, no un CTA).
        -->
        <div class="absolute inset-x-0 bottom-0 flex flex-col gap-0.5 p-3.5">
            <!--
                `min-h-[...]` reserva SIEMPRE el alto de 2 líneas (line-height
                × 2 de cada breakpoint): sin esto, un nombre corto de 1 línea
                deja el precio más arriba que en la tarjeta de al lado con
                nombre largo de 2 líneas — en la misma fila del grid se ve
                desalineado. `text-overflow: ellipsis` porque `line-clamp` de
                Tailwind por sí solo corta la 2da línea seca (sin "…"), y una
                palabra tronchada a media letra se lee como un error de
                render, no como un truncado intencional.
            -->
            <p
                class="line-clamp-2 min-h-[30px] text-xs font-medium leading-tight text-white/80 sm:min-h-[35px] sm:text-sm"
                style="text-shadow:0 1px 3px hsla(222,47%,4%,0.65);text-overflow:ellipsis"
            >
                {product.name}
            </p>
            <p
                class="text-xl font-extrabold tracking-tight text-white tabular-nums sm:text-2xl"
                style="text-shadow:0 1px 4px hsla(222,47%,4%,0.5)"
            >
                {price != null ? formatCurrency(price) : '—'}
            </p>
        </div>
    </div>
</PressableScale>
