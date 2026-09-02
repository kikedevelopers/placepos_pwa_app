<script lang="ts">
    import { fade, scale } from 'svelte/transition'
    import { cubicIn, cubicOut } from 'svelte/easing'
    import { Package, X } from '@lucide/svelte'
    import type { PosProduct } from '$lib/api/requests/pos'
    import { formatCurrency } from '$lib/utils/numbers'
    import { cn } from '$lib/utils'
    import ProductImage from '$lib/components/ProductImage.svelte'

    /**
     * Detalle de un producto del catálogo. `product` null = cerrado (el padre
     * decide qué ítem mostrar; este componente no tiene estado propio).
     */
    interface Props {
        product: PosProduct | null
        onClose: () => void
    }
    let { product, onClose }: Props = $props()

    const price = $derived(product?.prices[0]?.sale_price)
    const outOfStock = $derived((product?.stock ?? 0) <= 0)
    const code = $derived(product?.sku_code || product?.bar_code || '')

    // Transiciones asimétricas (emil-design-eng): la entrada es más lenta y
    // deliberada (que se note el "maximizar"), la salida es rápida y se siente
    // instantánea al soltar. `svelte/transition` (no CSS `animation`) porque es
    // la única forma de animar tanto el montaje COMO el desmontaje: una
    // `animation` de CSS nunca llega a jugarse al cerrar, el nodo desaparece
    // del DOM antes de que el navegador pinte el primer frame.
    const IN = { duration: 320, start: 0.82, opacity: 0, easing: cubicOut }
    const OUT = { duration: 200, start: 0.92, opacity: 0, easing: cubicIn }
</script>

{#if product}
    <!-- Sin padding en mobile (`p-0`): el panel llena el viewport entero, a
         pantalla completa, como una vista propia. Desde `sm:` recupera el aire
         alrededor y vuelve a ser el modal centrado de tablet/desktop. -->
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="catalog-detail-title"
    >
        <!-- Backdrop: solo cierra, no es contenido — fuera del tab order y del
             lector de pantalla para no duplicar el "Cerrar" de la X real. En
             mobile queda cubierto por el panel a pantalla completa (inofensivo). -->
        <button
            type="button"
            tabindex="-1"
            aria-hidden="true"
            class="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onclick={onClose}
            transition:fade={{ duration: 220 }}
        ></button>

        <!--
            "Maximizándose": crece desde 0.82 (nunca desde 0, emil-design-eng)
            hasta ocupar el modal, y se encoge de vuelta al cerrar. En mobile
            eso significa llenar literalmente la pantalla.

            SIN alto fijo (solo `max-height` desde `sm:`, y en mobile ni eso —
            `h-full` real): la columna de la foto mantiene su aspect-ratio en
            TODOS los breakpoints (nunca `aspect-auto`). Con `align-items:
            stretch` (default) el aspect-ratio decide cuánto aporta esta
            columna al alto de la fila ANTES del stretch final —así, con o sin
            foto, la fila nunca colapsa a la altura mínima de un ícono— y el
            stretch final iguala ambas columnas al alto que de verdad necesita
            el contenido.
        -->
        <div
            class="relative flex h-full w-full max-w-full flex-col overflow-hidden bg-card shadow-2xl sm:h-auto sm:max-h-[88dvh] sm:max-w-xl sm:rounded-3xl lg:max-h-[78dvh] lg:max-w-4xl lg:flex-row"
            in:scale={IN}
            out:scale={OUT}
        >
            <!-- 4:3 en mobile/tablet (menos alto que un cuadrado — deja más
                 sitio a los datos sin scrollear); cuadrada de nuevo en fila
                 (lg), que es lo que le da su alto a la columna hermana.
                 `object-cover` + `object-position` centrado (default) en el
                 <img>: la foto SIEMPRE llena el contenedor sin deformarse,
                 recortando parejo desde el centro, nunca estirándose. -->
            <div class="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-secondary lg:aspect-square lg:w-1/2">
                <div class={cn('h-full w-full', outOfStock && 'grayscale')}>
                    <ProductImage
                        url={product.image_url}
                        alt={product.name}
                        loading="eager"
                        class="h-full w-full object-cover"
                    >
                        {#snippet fallback()}
                            <div
                                class="flex h-full w-full items-center justify-center"
                                style="background:linear-gradient(135deg,hsl(213,94%,60%),hsl(221,83%,45%))"
                            >
                                <Package size={56} color="white" strokeWidth={1.4} />
                            </div>
                        {/snippet}
                    </ProductImage>
                </div>

                <!-- `top` con `max()`: en mobile a pantalla completa la X debe
                     respetar el notch/isla dinámica; en el modal flotante
                     (sm:+) el safe-area-inset es 0 y se comporta como antes. -->
                <button
                    type="button"
                    aria-label="Cerrar"
                    onclick={onClose}
                    class="absolute right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/45 backdrop-blur transition-transform duration-150 ease-out-strong active:scale-[0.92]"
                    style="top:max(0.75rem, env(safe-area-inset-top));box-shadow:0 4px 12px hsla(222,47%,4%,0.35)"
                >
                    <X size={19} color="white" strokeWidth={2.4} />
                </button>
            </div>

            <!--
                Jerarquía "fintech" (espejo de CatalogCard): un estado chico
                arriba (Disponible/Agotado, con su punto de color — reemplaza
                el eyebrow genérico "Detalle del producto" por información
                real), el nombre como título, y el PRECIO como la pieza que
                manda: grande, en negrita, tipografía plana sin caja ni cinta
                de color — un dato, no un botón. Reemplaza la cinta con
                degradado + ícono de tag de la versión anterior, que competía
                visualmente con el nombre en vez de subordinarse a él.
            -->
            <div
                class="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 pt-5 lg:gap-6 lg:p-8"
                style="padding-bottom:max(1.25rem, env(safe-area-inset-bottom))"
            >
                <div>
                    <div class="flex items-center gap-1.5">
                        <span
                            class="h-1.5 w-1.5 rounded-full"
                            style="background-color:{outOfStock ? 'hsl(0,84%,55%)' : 'hsl(158,64%,42%)'}"
                        ></span>
                        <span
                            class="text-[11px] font-semibold uppercase tracking-[0.14em]"
                            style="color:{outOfStock ? 'hsl(0,84%,45%)' : 'hsl(158,64%,36%)'}"
                        >
                            {outOfStock ? 'Agotado' : 'Disponible'}
                        </span>
                    </div>
                    <h2
                        id="catalog-detail-title"
                        class="mt-2 text-xl font-bold leading-tight tracking-tight text-foreground lg:text-2xl"
                    >
                        {product.name}
                    </h2>
                </div>

                <div>
                    <p class="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                        Precio
                    </p>
                    <p class="mt-0.5 text-4xl font-extrabold tracking-tight text-primary tabular-nums lg:text-5xl">
                        {price != null ? formatCurrency(price) : '—'}
                    </p>
                </div>

                {#if product.description}
                    <div class="border-t border-border pt-5">
                        <p class="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                            Descripción
                        </p>
                        <p class="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-foreground/80">
                            {product.description}
                        </p>
                    </div>
                {/if}

                {#if code}
                    <p class="mt-auto text-[11px] font-medium uppercase tracking-wide text-muted-foreground/60">
                        Código {code}
                    </p>
                {/if}
            </div>
        </div>
    </div>
{/if}
