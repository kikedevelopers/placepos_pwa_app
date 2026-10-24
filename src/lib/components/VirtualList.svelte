<!--
    Lista virtualizada de alto FIJO.

    Monta en el DOM solo las filas visibles (+ un colchón `overscan`), no las
    cientos que puede devolver el backend. Así entrar a Inventario/POS deja de
    congelarse por renderizar todo de golpe. La matemática vive en
    `$lib/utils/virtualWindow` (pura y testeada); aquí solo está el pegamento con
    el DOM: scroll, medición del alto real de una fila y pintado de la ventana.

    El alto de fila se MIDE del primer render (no se confía en un número mágico),
    así calza con el tamaño real en cada dispositivo. `gap` se pinta con flex en
    el bloque visible para que las posiciones coincidan con el cálculo.

    Para grillas (POS en modo cuadros) el consumidor parte los items en filas con
    `chunk(items, columns)` y pinta cada fila como una grilla de N columnas: cada
    "fila virtual" es una fila de la grilla.
-->
<script lang="ts" generics="T">
    import type { Snippet } from 'svelte'
    import { computeVirtualRange } from '$lib/utils/virtualWindow'

    interface Props {
        items: T[]
        /** Clave estable por item (para el keyed each). */
        getKey: (item: T, index: number) => string | number
        /** Pinta UNA fila. Recibe el item y su índice absoluto. */
        children: Snippet<[T, number]>
        /** Alto estimado de una fila (px); se corrige midiendo el primer render. */
        estimateHeight: number
        /** Separación vertical entre filas (px). */
        gap?: number
        /** Filas extra arriba/abajo para un scroll sin parpadeo. */
        overscan?: number
        /** Relleno superior del contenido (px). */
        padStart?: number
        /** Relleno inferior del contenido (px). */
        padEnd?: number
        /** Clases del contenedor de scroll. */
        class?: string
        /** Al cambiar, vuelve el scroll al tope (p. ej. el término de búsqueda). */
        resetKey?: unknown
        /**
         * Espacio extra al final del scroll como longitud CSS (p. ej.
         * `var(--dock-space)`), para que la última fila suba por encima de una
         * barra flotante. No entra en el cálculo de la ventana visible.
         */
        tailSpace?: string
    }

    let {
        items,
        getKey,
        children,
        estimateHeight,
        gap = 0,
        overscan = 6,
        padStart = 0,
        padEnd = 0,
        class: className = '',
        resetKey = undefined,
        tailSpace = undefined
    }: Props = $props()

    let scrollEl = $state<HTMLDivElement | null>(null)
    let scrollTop = $state(0)
    let viewportHeight = $state(0)
    // Alto medido del primer render (0 = aún sin medir → se usa la estimación).
    let measured = $state(0)
    const rowHeight = $derived(measured > 0 ? measured : estimateHeight)

    let rafId = 0
    const onScroll = () => {
        if (rafId) return
        rafId = requestAnimationFrame(() => {
            rafId = 0
            if (scrollEl) scrollTop = scrollEl.scrollTop
        })
    }

    // Alto visible del contenedor (y sus cambios: rotación, teclado, resize).
    $effect(() => {
        const el = scrollEl
        if (!el) return
        viewportHeight = el.clientHeight
        const ro = new ResizeObserver(() => {
            viewportHeight = el.clientHeight
        })
        ro.observe(el)
        return () => ro.disconnect()
    })

    // Reinicia el scroll al tope cuando cambia `resetKey` (nueva búsqueda, etc.).
    $effect(() => {
        void resetKey
        if (scrollEl) scrollEl.scrollTop = 0
        scrollTop = 0
    })

    const range = $derived(
        computeVirtualRange({
            scrollTop,
            viewportHeight,
            rowHeight,
            gap,
            count: items.length,
            overscan,
            padStart,
            padEnd
        })
    )

    const visible = $derived(items.slice(range.start, range.end))

    // Mide el alto real de una fila (todas iguales) y corrige la estimación para
    // que `offsetTop`/altura total calcen exactos. Se aplica a cada fila montada;
    // como todas miden lo mismo, el último en escribir deja el valor correcto.
    const measure = (node: HTMLElement) => {
        const apply = () => {
            const h = node.offsetHeight
            if (h > 0 && Math.abs(h - measured) > 0.5) measured = h
        }
        apply()
        const ro = new ResizeObserver(apply)
        ro.observe(node)
        return { destroy: () => ro.disconnect() }
    }
</script>

<div
    bind:this={scrollEl}
    onscroll={onScroll}
    class={`overflow-y-auto overscroll-contain ${className}`}
>
    <div style={`position:relative;height:${range.totalHeight}px`}>
        <div
            style={`position:absolute;top:0;left:0;right:0;transform:translateY(${range.offsetTop}px);display:flex;flex-direction:column;gap:${gap}px`}
        >
            {#each visible as item, i (getKey(item, range.start + i))}
                <div use:measure>
                    {@render children(item, range.start + i)}
                </div>
            {/each}
        </div>
    </div>
    {#if tailSpace}
        <div aria-hidden="true" data-testid="virtual-tail" style={`height:${tailSpace}`}></div>
    {/if}
</div>
